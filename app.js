// *** ENTERTAINMENT WIDGET *** 
const entDiv = document.getElementById("ent");
const entPref = document.getElementById("ent-preferences")
const entCover = document.getElementById("ent-cover")
const entInfo = document.getElementById("ent-info");

var flipped = 0;
var prefVisible = 0;
function flip(){
    entDiv.style.transform = entDiv.style.transform === 'rotateY(180deg)' 
    ? 'rotateY(0deg)' 
    : 'rotateY(180deg)';

    flipped = entDiv.style.transform=='rotateY(0deg)'
        ? 0
        : 1;
}

function preferences(){
    if(prefVisible==0){
        if(generated==0){
            document.getElementById("spin").style.transform = 'rotate(100deg)';
            sleep(100).then(() => {
                flip();            
                prefVisible = 1;
                entPref.style.display = 'flex';
                if(flipped==1){
                    entPref.style.transform = 'rotateY(180deg)';
                    entInfo.style.display = 'none';
                } else{
                    entPref.style.transform = 'rotateY(0deg)';
                    entCover.style.display = 'none';
                }
            });
        } else{
            flip();
            prefVisible = 1;
            entPref.style.display = 'flex';
            if(flipped==1){
                entPref.style.transform = 'rotateY(180deg)';
                entInfo.style.display = 'none';
            } else{
                entPref.style.transform = 'rotateY(0deg)';
                entCover.style.display = 'none';
            }
        }
    } else{
        flip()
        prefVisible = 0;
        sleep(400).then(() => { 
            if(generated==1){
                entPref.style.display = 'none';
                entInfo.style.display = 'flex';
                entCover.style.display = 'flex';
            } else{
                document.getElementById("spin").style.transform = 'rotate(0deg)';
            }
         });
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var count = 0;
function play(){
    if(count==0){
        count = 1;
        document.getElementById("track").load();
        document.getElementById("track").play();
    } else{
        count = 0;
        document.getElementById("track").pause();
    }
}

var generated = 0;
function reveal(){
    if(document.getElementById("cover-title").dataset.trackName){
        if(generated==1){
            document.getElementById("cover-title").textContent = document.getElementById("cover-title").dataset.trackName;
            document.getElementById("album-img").style.filter = 'blur(0px)';
            document.getElementById('cover-button').innerHTML = '<button onclick="flip()">INFO</button>';
        }
    }
}


const infoWrapper = document.getElementById("info-wrapper");
const titleDiv = document.getElementById("info-title");
const artistDiv = document.getElementById("artist");
const albumDiv = document.getElementById("album-name");

function overflowScrollInfo(textDiv) {
    let prefix = ''
    switch(textDiv){
        case titleDiv:
            prefix = 'title';
            break;
        case artistDiv:
            prefix = 'artist';
            break;
        case albumDiv:
            prefix = 'album';
            break;
        default:
            console.log('ERROR');
            break;
    }
    if (textDiv.offsetWidth > (infoWrapper.offsetWidth)) {
        textDiv.classList.add('scrolling');
        textDiv.classList.add('scroll-spacing');

        document.getElementById(`${prefix}-2`).textContent = textDiv.textContent;
        document.getElementById(`${prefix}-2`).classList.add('scrolling2');
        document.getElementById(`${prefix}-2`).classList.add('scroll-spacing');
    } else{
        textDiv.classList.remove('scrolling');
        document.getElementById(`${prefix}-2`).textContent = '';
        document.getElementById(`${prefix}-2`).classList.remove('scrolling2');
        document.getElementById(`${prefix}-2`).classList.remove('scroll-spacing');
    }
}

const infoResizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
        if (entry.target) {
            overflowScrollInfo(entry.target);
        }
    }
});

infoResizeObserver.observe(titleDiv);
infoResizeObserver.observe(artistDiv);
infoResizeObserver.observe(albumDiv);


const coverWrapper = document.getElementById("ent-cover");
const coverTitle = document.getElementById("cover-title");

const coverResizeObserver = new ResizeObserver(() => {
    (function overflowScrollCover() {
        const scrollDiv = document.getElementById('cover-title-2')
        if (coverTitle.offsetWidth > (coverWrapper.offsetWidth * 0.80)) {
            coverTitle.classList.add('coverScroll');
            coverTitle.classList.add('scroll-spacing');
    
            scrollDiv.style.display = 'block';
            scrollDiv.textContent = coverTitle.textContent;
            scrollDiv.classList.add('coverScroll2');
            scrollDiv.classList.add('scroll-spacing');
        } else{
            coverTitle.parentElement.style.justifyContent = 'center';
            coverTitle.classList.remove('coverScroll');
            coverTitle.classList.remove('scroll-spacing');
    

            scrollDiv.style.display = 'none';
            scrollDiv.textContent = '';
            scrollDiv.classList.remove('coverScroll2');
            scrollDiv.classList.remove('scroll-spacing');
        }
    })();
})

coverResizeObserver.observe(coverTitle);


// API back-end
const APIController = (function() {
    const clientId = '9166be1779354c139ed15ab76687f239';
    const clientSecret = 'bd44fcee05f2409ea59671ea0282c6cd';

    const _getToken = async () => {
        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded', 
                'Authorization' : 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await result.json();
        return data.access_token;
    }

    const _getRecommendations = async (token, genres, limit = 1) => {
        try {
            const result = await fetch(`https://api.spotify.com/v1/recommendations?limit=${limit}&seed_genres=${genres.join(',')}`, {
                method: 'GET',
                headers: { 'Authorization' : 'Bearer ' + token}
            });
    
            if (!result.ok) {
                throw new Error(`HTTP error! status: ${result.status}`);
            }
    
            const data = await result.json();
            return data.tracks;
        } catch (error) {
            console.error("Error fetching recommendations:", error);
            return [];
        }
    }

    return {
        getToken() {
            return _getToken();
        },
        getRecommendations(token, genres, limit) {
            return _getRecommendations(token, genres, limit);
        }
    }
})();


// In UIController
const UIController = (function() {
    const DOMElements = {
        hfToken: '#hidden_token',
        genreSelect: '#genre-select',
        recommendButton: '#ent-save'
    }

    return {
        inputField() {
            return {
                genreSelect: document.querySelector(DOMElements.genreSelect),
                recommendButton: document.querySelector(DOMElements.recommendButton)
            }
        },

        displayRecommendation(track) {
            if(track.preview_url){
                document.getElementById("trackSrc").src = track.preview_url;
            } else{
                console.log('No audio preview.');
                document.getElementById("play-button").style.backgroundColor = '#774E45';
                document.getElementById("play-button").style.borderColor = '#774E45';
            }

            console.log(track.preview_url)
        
            document.getElementById("album-img").parentElement.innerHTML = '<img id="album-img" src="" draggable="false"></img>';
            document.getElementById("album-img").src = track.album.images[0].url;
            document.getElementById("album-img").style.filter = 'blur(10px)';
            document.getElementById("album-img").alt = track.album.name;
            document.getElementById("cover-title").dataset.trackName = track.name;
            document.getElementById("info-title").textContent = track.name;
            document.getElementById("artist").textContent = track.artists[0].name;
            document.getElementById("album-name").textContent = track.album.name;
            document.getElementById("year").textContent = track.album.release_date.split('-')[0];
            document.getElementById("track-link").href = track.external_urls.spotify;

            // document.getElementById("ent-cover-text-cqi").textContent = track.name;
        },

        storeToken(value) {
            document.querySelector(DOMElements.hfToken).value = value;
        },

        getStoredToken() {
            return {
                token: document.querySelector(DOMElements.hfToken).value
            }
        }
    }
})();

// In APPController
const APPController = (function(UICtrl, APICtrl) {
    const DOMInputs = UICtrl.inputField();
    let dailyUpdateTimeout;

    const loadGenres = async () => {
        const token = await APICtrl.getToken();           
        UICtrl.storeToken(token);
    }

    const getSelectedGenres = () => {
        return Array.from(DOMInputs.genreSelect.selectedOptions).map(option => option.value);
    }

    const generateRecommendation = async () => {
        const token = UICtrl.getStoredToken().token;
        const selectedGenres = getSelectedGenres();
        if (selectedGenres.length === 0) {
            console.log('No genres selected');
            return;
        } else{
            document.getElementById("ent-welcome").style.display = 'none';
            generated = 1;
        }
        const tracks = await APICtrl.getRecommendations(token, selectedGenres, 1);
        if (tracks.length > 0) {
            UICtrl.displayRecommendation(tracks[0]);
        } else {
            console.log('No recommendations found');
        }
    }

    const scheduleDailyUpdate = () => {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);  // Ensure it's midnight
        const millisTillMidnight = tomorrow.getTime() - now.getTime();

        if (dailyUpdateTimeout) {
            clearTimeout(dailyUpdateTimeout);
        }

        dailyUpdateTimeout = setTimeout(() => {
            generateRecommendation();
            scheduleDailyUpdate(); // Schedule the next update
        }, millisTillMidnight);

        // Log the next update time (for debugging)
        console.log(`Next update scheduled for: ${tomorrow.toLocaleString()}`);
    }

    let initialRecommendationGenerated = false;

    const checkAndGenerateRecommendation = () => {
        if (!initialRecommendationGenerated) {
            const selectedGenres = getSelectedGenres();
            if (selectedGenres.length > 0) {
                generateRecommendation();
                scheduleDailyUpdate();
                initialRecommendationGenerated = true;
                DOMInputs.genreSelect.removeEventListener('change', checkAndGenerateRecommendation);
                DOMInputs.genreSelect.addEventListener('change', handleGenreChange);
                DOMInputs.recommendButton.removeEventListener('click', checkAndGenerateRecommendation);
            }
        }
    }

    let genresChanged = false;

    const handleGenreChange = () => {
        genresChanged = true;
        const selectedGenres = getSelectedGenres();
        if (selectedGenres.length > 0) {
            scheduleDailyUpdate();
        } else {
            if (dailyUpdateTimeout) {
                clearTimeout(dailyUpdateTimeout);
            }
            DOMInputs.genreSelect.addEventListener('change', checkAndGenerateRecommendation);
        }
    }

    return {
        init() {
            console.log('App is starting');
            loadGenres();
            DOMInputs.recommendButton.addEventListener('click', checkAndGenerateRecommendation);

            // Check every minute if it's midnight and needs to update
            setInterval(() => {
                const now = new Date();
                if (now.getHours() === 0 && now.getMinutes() === 0) {
                    if (genresChanged) {
                        generateRecommendation();
                        genresChanged = false;
                    }
                    scheduleDailyUpdate();
                }
            }, 60 * 1000); // Check every minute
        }
    }
})(UIController, APIController);

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    APPController.init();
});

// *** PRODUCTIVITY WIDGET ***
// DOM elements
const prodMain = document.getElementById('prod-main');
const toDo = document.getElementById('to-do');
const inProgress = document.getElementById('in-progress');
const done = document.getElementById('done');
const whiteButton = document.querySelector('.circle.white')
const redButton = document.querySelector('.circle.red');
const orangeButton = document.querySelector('.circle.orange');
const greenButton = document.querySelector('.circle.green');
const deleteButton = document.querySelector('.control.delete');
const addButton = document.querySelector('.control.add');

// State Management
function hideAllDivs() {
    prodMain.style.display = 'none';
    toDo.style.display = 'none';
    inProgress.style.display = 'none';
    done.style.display = 'none';
}

function showDiv(div) {
    hideAllDivs();
    div.style.display = 'block';
    
    if (div !== prodMain) {
        const tasksContainer = div.querySelector('.tasks-container');
        const tasks = tasksContainer.querySelectorAll('.tasks');
        tasks.forEach(makeDraggableOrSelectable);
        sortTasks(tasksContainer);
    }
}

// Task Management
function addTask() {
    let currentOpenState;
    if (toDo.style.display === 'block') {
        currentOpenState = toDo;
    } else if (inProgress.style.display === 'block') {
        currentOpenState = inProgress;
    } else if (done.style.display === 'block') {
        currentOpenState = done;
    } else {
        // If no state is open, don't add a task
        return;
    }

    const tasksContainer = currentOpenState.querySelector('.tasks-container');
    const newTask = createTaskDiv();
    tasksContainer.appendChild(newTask);
    updateTaskDateColor(newTask, currentOpenState.id);
    
    sortTasks(tasksContainer);
    updateTaskPositions(tasksContainer);
    scrollToTask(newTask);
    updatePieChart();
    updateAllEmptyStates();
    makeDraggableOrSelectable(newTask);
    updateTaskInteractionMode();
}

function createTaskDiv() {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'tasks';
    taskDiv.id = 'task-' + Date.now(); // Add a unique id
    taskDiv.style.minHeight = '5em';
    
    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';
    
    const taskWritten = document.createElement('div');
    taskWritten.className = 'task-written';
    
    const taskDate = document.createElement('div');
    taskDate.className = 'task-date';

    const taskWrittenText = document.createElement('div');
    taskWrittenText.className = 'task-written-text';
    taskWrittenText.contentEditable = true;

    const taskDatePicker = document.createElement('input');
    taskDatePicker.className = 'task-date-picker';
    taskDatePicker.type = 'date';
    
    const taskDateDisplay = document.createElement('div');
    taskDateDisplay.className = 'task-date-display';
    taskDateDisplay.innerHTML = "Set Date";

    taskDatePicker.addEventListener('change', function() {
        const selectedDate = new Date(this.value);
        if (isNaN(selectedDate.getTime())) {
            // Date was removed
            delete taskDiv.dataset.date;
            taskDateDisplay.textContent = "Set Date";
        } else {
            // Date was set
            const formattedDate = selectedDate.toLocaleDateString('en-US', { 
                month: 'numeric', 
                day: 'numeric',
                year: 'numeric'
            });
            taskDateDisplay.textContent = formattedDate;
            taskDiv.dataset.date = this.value; // Store the date in ISO format
        }
        sortTasks(taskDiv.closest('.tasks-container'));
        scrollToTask(taskDiv); // Scroll to the task after sorting
    });
    
    taskContent.appendChild(taskWritten);
    taskContent.appendChild(taskDate);
    taskWritten.appendChild(taskWrittenText);
    taskDate.appendChild(taskDatePicker);
    taskDate.appendChild(taskDateDisplay);
    taskDiv.appendChild(taskContent);
    
    if (isMobile()) {
        const reorderButtons = document.createElement('div');
        reorderButtons.className = 'reorder-buttons';
        
        const upButton = document.createElement('button');
        upButton.textContent = '↑';
        upButton.addEventListener('click', (e) => reorderTask(e, 'up'));
        
        const downButton = document.createElement('button');
        downButton.textContent = '↓';
        downButton.addEventListener('click', (e) => reorderTask(e, 'down'));
        
        reorderButtons.appendChild(upButton);
        reorderButtons.appendChild(downButton);
        
        taskDiv.appendChild(reorderButtons);
    }

    const reorderButtons = document.createElement('div');
    reorderButtons.className = 'reorder-buttons';
    reorderButtons.style.display = 'none';
    
    const upButton = document.createElement('button');
    upButton.textContent = '↑';
    upButton.addEventListener('click', (e) => reorderTask(e, 'up'));
    
    const downButton = document.createElement('button');
    downButton.textContent = '↓';
    downButton.addEventListener('click', (e) => reorderTask(e, 'down'));
    
    reorderButtons.appendChild(upButton);
    reorderButtons.appendChild(downButton);
    
    taskDiv.appendChild(reorderButtons);

    setupTaskResizeObserver(taskDiv);
    makeDraggableOrSelectable(taskDiv);

    return taskDiv;
}

function updateTaskPositions(container) {
    const tasks = Array.from(container.children);
    const lastUndatedTask = tasks.filter(task => !task.dataset.date).pop();
    const firstDatedTask = tasks.find(task => task.dataset.date);

    if (lastUndatedTask && firstDatedTask) {
        container.insertBefore(firstDatedTask, lastUndatedTask.nextSibling);
    }

    sortTasks(container);
}

setupCategoryCircles();

const categoryColors = {
    'to-do': '#C61414',
    'in-progress': '#DDBA3A',
    'done': '#8B8D3A'
};

function updateTaskDateColor(taskDiv, categoryId) {
    const taskDate = taskDiv.querySelector('.task-date');
    taskDate.style.backgroundColor = categoryColors[categoryId];
}

function setupTaskResizeObserver(taskElement) {
    const taskContent = taskElement.querySelector('.task-content');
    const taskWrittenText = taskElement.querySelector('.task-written-text');
    const taskWritten = taskElement.querySelector('.task-written');
    const taskDate = taskElement.querySelector('.task-date');

    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            // Get the root font size for em calculations
            const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
            
            // Calculate the content height in em
            const contentHeightEm = entry.contentRect.height / rootFontSize;
            
            // Add a small buffer and ensure minimum height
            const newHeightEm = Math.max(contentHeightEm + 1.5, 5);
            
            requestAnimationFrame(() => {
                const heightStyle = `${newHeightEm}em`;
                taskElement.style.height = heightStyle;
                taskContent.style.height = heightStyle;
                taskWritten.style.height = heightStyle;
                taskDate.style.height = heightStyle;
            });
        }
    });

    resizeObserver.observe(taskWrittenText);
}

// Event listeners for the buttons
redButton.addEventListener('click', () => showDiv(toDo));
orangeButton.addEventListener('click', () => showDiv(inProgress));
greenButton.addEventListener('click', () => showDiv(done));
whiteButton.addEventListener('click', () => showDiv(prodMain));
addButton.addEventListener('click', addTask);

// Scrollbar Visibility
function updateScrollVisibility(container) {
    if (container.scrollHeight > container.clientHeight) {
        container.style.overflowY = 'scroll';
    } else if (container.scrollHeight < container.clientHeight) {
        container.style.overflowY = 'hidden';
    }
}

[toDo, inProgress, done].forEach(state => {
    const container = state.querySelector('.tasks-container');
    updateScrollVisibility(container);
});

// Pie Chart Management
function updatePieChart() {
    const todoTasks = toDo.querySelectorAll('.tasks').length;
    const inProgressTasks = inProgress.querySelectorAll('.tasks').length;
    const doneTasks = done.querySelectorAll('.tasks').length;
    const totalTasks = todoTasks + inProgressTasks + doneTasks;
    const remainingTasks = todoTasks + inProgressTasks;

    const pie = document.querySelector('.pie');
    const taskCount = pie.querySelector('.task-count');
    const unfinishedTasks = pie.querySelector('.unfinished-tasks');

    if (totalTasks === 0) {
        // Reset pie chart when there are no tasks
        pie.style.setProperty('--p1', 0);
        pie.style.setProperty('--p2', 0);
        pie.style.setProperty('--p3', 100);
        taskCount.innerHTML = '0';
        unfinishedTasks.innerHTML = 'unfinished tasks';
        return;
    }

    const todoPercentage = (todoTasks / totalTasks) * 100;
    const inProgressPercentage = (inProgressTasks / totalTasks) * 100;
    const donePercentage = (doneTasks / totalTasks) * 100;

    pie.style.setProperty('--p1', todoPercentage);
    pie.style.setProperty('--p2', inProgressPercentage);
    pie.style.setProperty('--p3', donePercentage);

    // Update the task count
    taskCount.innerHTML = `${remainingTasks}`;

    // Update the text
    if (remainingTasks === 1) {
        unfinishedTasks.innerHTML = 'unfinished task';
    } else {
        unfinishedTasks.innerHTML = 'unfinished tasks';
    }
}

//Task Sorting
function sortTasks(container) {
    const tasks = Array.from(container.children);
    const datedTasks = tasks.filter(task => task.dataset.date);
    const undatedTasks = tasks.filter(task => !task.dataset.date);

    // Sort dated tasks
    datedTasks.sort((a, b) => {
        const dateA = new Date(a.dataset.date);
        const dateB = new Date(b.dataset.date);
        return dateA - dateB;
    });

    // Clear container
    container.innerHTML = '';

    // Append undated tasks first, maintaining their order
    undatedTasks.forEach(task => container.appendChild(task));

    // Append dated tasks
    datedTasks.forEach(task => container.appendChild(task));
}

// Task Interaction
function makeDraggableOrSelectable(taskDiv) {
    const reorderButtons = document.createElement('div');
    reorderButtons.className = 'reorder-buttons';
    
    const upButton = document.createElement('button');
    upButton.textContent = '↑';
    upButton.addEventListener('click', (e) => reorderTask(e, 'up'));
    
    const downButton = document.createElement('button');
    downButton.textContent = '↓';
    downButton.addEventListener('click', (e) => reorderTask(e, 'down'));
    
    reorderButtons.appendChild(upButton);
    reorderButtons.appendChild(downButton);
    
    taskDiv.appendChild(reorderButtons);

    updateTaskInteractionMode();
}

let selectedTask = null;

function selectTask(e) {
    if (selectedTask) {
        selectedTask.classList.remove('selected');
        if (isMobile()) {
            selectedTask.querySelector('.reorder-buttons').style.display = 'none';
        }
    }
    
    const task = e.currentTarget;
    task.classList.add('selected');
    selectedTask = task;
    
    if (isMobile()) {
        task.querySelector('.reorder-buttons').style.display = 'flex';
    }
}

function dragStart(e) {
    const task = e.target;
    e.dataTransfer.setData('text/plain', task.id);
    setTimeout(() => task.classList.add('dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
}

function dragEnd(e) {
    e.target.classList.remove('dragging');
}

function setupCategoryCircles() {
    const circles = document.querySelectorAll('.circle:not(.white)');
    circles.forEach(circle => {
        if (isMobile()) {
            circle.addEventListener('click', moveTask);
        } else {
            circle.addEventListener('dragover', dragOver);
            circle.addEventListener('dragleave', dragLeave);
            circle.addEventListener('drop', drop);
        }
    });

    if (!isMobile()) {
        const taskContainers = document.querySelectorAll('.tasks-container');
        taskContainers.forEach(container => {
            container.addEventListener('dragover', dragOverTask);
            container.addEventListener('drop', dropWithinContainer);
        });
    }

    const deleteButton = document.querySelector('.control.delete');
    if (isMobile()) {
        deleteButton.addEventListener('click', deleteSelectedTask);
    } else {
        deleteButton.addEventListener('dragover', dragOverDelete);
        deleteButton.addEventListener('dragleave', dragLeaveDelete);
        deleteButton.addEventListener('drop', dropDelete);
    }
}

// Drag and Drop Functions
function dragOver(e) {
    e.preventDefault();
    e.target.style.transform = 'scale(1.7)';
}

function dragOverTask(e) {
    e.preventDefault();
    const draggable = document.querySelector('.dragging');
    const container = e.currentTarget;
    
    // Allow dropping only if it's a different container or the task doesn't have a date
    if (container !== draggable.parentElement || !draggable.dataset.date) {
        const afterElement = getDragAfterElement(container, e.clientY);
        
        if (afterElement == null) {
            container.appendChild(draggable);
        } else {
            container.insertBefore(draggable, afterElement);
        }
    }
}

// determine where to place the dragged task
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.tasks:not(.dragging):not([data-date])')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function dragLeave(e) {
    e.target.style.transform = '';
}

function drop(e) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text');
    const task = document.getElementById(taskId);
    
    let targetContainer;
    if (e.target.classList.contains('red')) {
        targetContainer = toDo.querySelector('.tasks-container');
    } else if (e.target.classList.contains('orange')) {
        targetContainer = inProgress.querySelector('.tasks-container');
    } else if (e.target.classList.contains('green')) {
        targetContainer = done.querySelector('.tasks-container');
    }

    if (targetContainer && targetContainer !== task.parentElement) {
        targetContainer.appendChild(task);
        updateTaskDateColor(task, targetContainer.closest('.state').id);
        updateTaskPositions(targetContainer);
        updatePieChart();
        scrollToTask(task);
        updateAllEmptyStates();
    }

    e.target.style.transform = '';
}

function dropWithinContainer(e) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text');
    const task = document.getElementById(taskId);
    const container = e.currentTarget;

    // Only allow reordering if task has no date and in the same container
    if (!task.dataset.date && container === task.parentElement) {
        const afterElement = getDragAfterElement(container, e.clientY);
        if (afterElement == null) {
            container.appendChild(task);
        } else {
            container.insertBefore(task, afterElement);
        }
    } else if (container !== task.parentElement) {
        // If it's a different container, allow the move
        container.appendChild(task);
        updateTaskDateColor(task, container.closest('.state').id);
    }

    sortTasks(container);
    updatePieChart();
    scrollToTask(task);
    updateAllEmptyStates();
}

function dragOverDelete(e) {
    e.preventDefault();
    e.target.classList.add('delete-hover');
}

function dragLeaveDelete(e) {
    e.target.classList.remove('delete-hover');
}

function dropDelete(e) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text');
    const task = document.getElementById(taskId);
    if (task) {
        task.remove();
        updatePieChart();
        updateAllEmptyStates();
    }
    e.target.classList.remove('delete-hover');
}

// Helper Functions
function scrollToTask(task) {
    const container = task.closest('.tasks-container');
    if (container.scrollHeight > container.clientHeight) {
        const scrollPosition = task.offsetTop - container.clientHeight / 2 + task.clientHeight / 2;
        container.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
        });
    }
}

function updateEmptyState(container) {
    const tasks = container.querySelectorAll('.tasks');
    let emptyState = container.querySelector('.empty-state');
    
    if (tasks.length === 0) {
        if (!emptyState) {
            emptyState = document.createElement('div');
            emptyState.classList.add('empty-state');
            const state = container.closest('.state').id;
            const message = {
                'to-do': 'There are no tasks to do.',
                'in-progress': 'There are no tasks in progress.',
                'done': 'There are no tasks completed.'
            }[state];
            emptyState.textContent = message;
            container.appendChild(emptyState);
        }
        emptyState.style.display = 'block';
    } else if (emptyState) {
        emptyState.style.display = 'none';
    }
}

function updateAllEmptyStates() {
    const containers = document.querySelectorAll('.tasks-container');
    containers.forEach(updateEmptyState);
}

function isMobile() {
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

function moveTask(e) {
    if (!selectedTask) return;

    let targetContainer;
    if (e.target.classList.contains('red')) {
        targetContainer = toDo.querySelector('.tasks-container');
    } else if (e.target.classList.contains('orange')) {
        targetContainer = inProgress.querySelector('.tasks-container');
    } else if (e.target.classList.contains('green')) {
        targetContainer = done.querySelector('.tasks-container');
    }

    if (targetContainer && targetContainer !== selectedTask.parentElement) {
        targetContainer.appendChild(selectedTask);
        updateTaskDateColor(selectedTask, targetContainer.closest('.state').id);
        updateTaskPositions(targetContainer);
        updatePieChart();
        scrollToTask(selectedTask);
        updateAllEmptyStates();
    }

    selectedTask.classList.remove('selected');
    selectedTask = null;
}

function deleteSelectedTask() {
    if (selectedTask) {
        selectedTask.remove();
        updatePieChart();
        updateAllEmptyStates();
        selectedTask = null;
    }
}

function reorderTask(e, direction) {
    e.stopPropagation();
    const task = e.target.closest('.tasks');
    const container = task.parentElement;
    
    if (direction === 'up' && task.previousElementSibling) {
        container.insertBefore(task, task.previousElementSibling);
    } else if (direction === 'down' && task.nextElementSibling) {
        container.insertBefore(task.nextElementSibling, task);
    }
    
    updateTaskPositions(container);
    scrollToTask(task);
}

function updateTaskInteractionMode() {
    const tasks = document.querySelectorAll('.tasks');
    const isMobileDevice = isMobile();

    tasks.forEach(task => {
        if (isMobileDevice) {
            task.draggable = false;
            task.removeEventListener('dragstart', dragStart);
            task.removeEventListener('dragend', dragEnd);
            task.addEventListener('click', selectTask);
        } else {
            task.draggable = true;
            task.addEventListener('dragstart', dragStart);
            task.addEventListener('dragend', dragEnd);
            task.removeEventListener('click', selectTask);
        }

        // create reorder buttons, but hidden by default
        const reorderButtons = task.querySelector('.reorder-buttons');
        if (reorderButtons) {
            reorderButtons.style.display = 'none';
        }
    });

    const circles = document.querySelectorAll('.circle:not(.white)');
    circles.forEach(circle => {
        if (isMobileDevice) {
            circle.removeEventListener('dragover', dragOver);
            circle.removeEventListener('dragleave', dragLeave);
            circle.removeEventListener('drop', drop);
            circle.addEventListener('click', moveTask);
        } else {
            circle.addEventListener('dragover', dragOver);
            circle.addEventListener('dragleave', dragLeave);
            circle.addEventListener('drop', drop);
            circle.removeEventListener('click', moveTask);
        }
    });

    const deleteButton = document.querySelector('.control.delete');
    if (isMobileDevice) {
        deleteButton.removeEventListener('dragover', dragOverDelete);
        deleteButton.removeEventListener('dragleave', dragLeaveDelete);
        deleteButton.removeEventListener('drop', dropDelete);
        deleteButton.addEventListener('click', deleteSelectedTask);
    } else {
        deleteButton.addEventListener('dragover', dragOverDelete);
        deleteButton.addEventListener('dragleave', dragLeaveDelete);
        deleteButton.addEventListener('drop', dropDelete);
        deleteButton.removeEventListener('click', deleteSelectedTask);
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    showDiv(prodMain);
    updatePieChart();
    updateTaskInteractionMode();
    updateAllEmptyStates();
});

window.addEventListener('resize', updateTaskInteractionMode);

// *** EDUCATIONAL WIDGET ***
const today = new Date();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const currentYear = today.getFullYear();
const date = new Date(2000, month - 1, day);
const dateString = date.toLocaleString('en-US', { month: 'long', day: 'numeric' }) + ',';

let eduContent = [];
let currentIndex = 0;
let isAnimating = false;

async function fetchHistoricalEvents() {
    let url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${month}/${day}`;

    try {
        let response = await fetch(url, {
            headers: {
                'User-Agent': 'On This Day in History/1.0 jarron.decrepito26@gmail.com'
            }
        });

        let data = await response.json();

        function getRandomItem(arr) {
            return arr[Math.floor(Math.random() * arr.length)];
        }

        function extractDetails(item, isHoliday = false) {
            return {
                text: item.text,
                year: isHoliday ? currentYear : item.year,
                thumbnail: item.pages[0]?.thumbnail?.source || 'No thumbnail available'
            };
        }

        eduContent = [
            ['events', extractDetails(getRandomItem(data.events))],
            ['births', extractDetails(getRandomItem(data.births))],
            ['deaths', extractDetails(getRandomItem(data.deaths))],
            ['holidays', extractDetails(getRandomItem(data.holidays), true)],
            ['selected', extractDetails(getRandomItem(data.selected))]
        ];

        console.log('Historical Events:', eduContent);
    } catch (error) {
        console.error(error);
        eduContent = [];
    }
}

function displayCurrentEvent() {
    if (eduContent.length > 0) {
        const prevIndex = (currentIndex - 1 + eduContent.length) % eduContent.length;
        const nextIndex = (currentIndex + 1) % eduContent.length;

        const displayEvent = (index, prefix) => {
            const category = eduContent[index][0];
            const event = eduContent[index][1];
            const contentDiv = document.getElementById(`edu-${prefix}`);
            const bgDiv = document.getElementById(`edu-${prefix}-bg`);

            const displayCategory = category === 'selected' ? 'events' : category;
            
            document.getElementById(`${prefix}-category`).textContent = displayCategory.charAt(0).toUpperCase() + displayCategory.slice(1);
            document.getElementById(`${prefix}-year`).textContent = event.year;
            contentDiv.textContent = event.text;

            if (bgDiv) {
                const event = eduContent[index][1];
                if (event.thumbnail && event.thumbnail !== 'No thumbnail available') {
                    bgDiv.style.backgroundImage = `
                        linear-gradient(to right, rgba(45, 21, 16, 1), rgba(90, 49, 32, 0.8) 100%),
                        url('${event.thumbnail}')
                    `;
                } else {
                    bgDiv.style.backgroundImage = `rgb(90, 49, 32)`;
                }
            }

            let size = parseInt(window.getComputedStyle(contentDiv).fontSize);

            function resize() {
                if (contentDiv.offsetHeight > (bgDiv.offsetHeight) * 0.68) {
                    while (contentDiv.offsetHeight > (bgDiv.offsetHeight) * 0.68) {
                        size--;
                        contentDiv.style.fontSize = size + 'px';
                    }
                }
            }

            const resizeObserver = new ResizeObserver(() => {
                contentDiv.style.fontSize = '';
                size = parseInt(window.getComputedStyle(contentDiv).fontSize);
                resize();
            });

            resizeObserver.observe(contentDiv);
            resizeObserver.observe(bgDiv);
        };

        displayEvent(currentIndex, "current");
        displayEvent(nextIndex, "next");
        displayEvent(prevIndex, "prev");

        document.getElementById("edu-date").textContent = dateString;
    } else {
        console.error("No historical events fetched");
    }
}

const eduSlider = document.getElementById("edu-content-section");
const eduCategory = document.getElementById("edu-category");
const eduYear = document.getElementById("edu-year");

function nextEvent() {
    if (!isAnimating) {
        isAnimating = true;
        eduSlider.style.transition = "0.6s ease";
        eduSlider.style.transform = "translateY(-66.6666%)";
    
        sleep(400).then(() => { 
            eduCategory.style.transition = "0.6s ease";
            eduCategory.style.transform = 'translateY(-66.6666%)';
            eduYear.style.transition = "0.6s ease";
            eduYear.style.transform = 'translateY(-66.6666%)';
            sleep(600).then(() => {
                currentIndex = (currentIndex + 1) % eduContent.length;
                displayCurrentEvent();
                eduCategory.style.transition = "none";
                eduCategory.style.transform = 'translateY(-33.3333%)';
                eduYear.style.transition = "none";
                eduYear.style.transform = 'translateY(-33.3333%)';
                eduSlider.style.transition = "none";
                eduSlider.style.transform = "translateY(-33.3333%)";
                isAnimating = false;
                resetAutoNextTimer();
            });
        });
    }
}

function prevEvent() {
    if (!isAnimating) {
        isAnimating = true;
        eduSlider.style.transition = "0.6s ease";
        eduSlider.style.transform = "translateY(0%)";
        
        sleep(400).then(() => { 
            eduCategory.style.transition = "0.6s ease";
            eduCategory.style.transform = 'translateY(0%)';
            eduYear.style.transition = "0.6s ease";
            eduYear.style.transform = 'translateY(0%)';
            sleep(600).then(() => {
                currentIndex = (currentIndex - 1 + eduContent.length) % eduContent.length;
                displayCurrentEvent();
                eduCategory.style.transition = "none";
                eduCategory.style.transform = 'translateY(-33.3333%)';
                eduYear.style.transition = "none";
                eduYear.style.transform = 'translateY(-33.3333%)';
                eduSlider.style.transition = "none";
                eduSlider.style.transform = "translateY(-33.3333%)";
                isAnimating = false;
                resetAutoNextTimer();
            });
        });
    }
}

async function initEduContent() {
    await fetchHistoricalEvents();
    displayCurrentEvent();
    resetAutoNextTimer();
}

initEduContent();

let startY = 0;
let dragging = false;
let eventTriggered = false;

function handleStart(e) {
    startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    dragging = true;
    eventTriggered = false;
    resetAutoNextTimer();
}

function handleMove(e) {
    if (dragging) {
        const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        const deltaY = startY - currentY;

        if (deltaY > 10 && !eventTriggered) {
            nextEvent();
            eventTriggered = true;
        } else if (deltaY < -10 && !eventTriggered) {
            prevEvent();
            eventTriggered = true;
        }

        startY = currentY;
        resetAutoNextTimer();
    }
}

function handleEnd() {
    dragging = false;
    resetAutoNextTimer();
}

// Add mouse event listeners
eduSlider.addEventListener('mousedown', handleStart);
document.addEventListener('mousemove', handleMove);
document.addEventListener('mouseup', handleEnd);

// Add touch event listeners
eduSlider.addEventListener('touchstart', handleStart);
document.addEventListener('touchmove', handleMove);
document.addEventListener('touchend', handleEnd);

let autoNextTimer;
function resetAutoNextTimer() {
    clearTimeout(autoNextTimer);
    autoNextTimer = setTimeout(nextEvent, 20000);
}