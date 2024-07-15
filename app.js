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
    
    console.log(flipped);
}

function preferences(){
    flip();
    if(prefVisible==0){
        prefVisible = 1;
        entPref.style.display = 'block';
        if(flipped==1){
            entPref.style.transform = 'rotateY(180deg)';
            entInfo.style.display = 'none';
        } else{
            entPref.style.transform = 'rotate(0deg)';
            entCover.style.display = 'none';
        }
    } else{
        prefVisible = 0;
        sleep(600).then(() => { 
            entPref.style.display = 'none';
            entInfo.style.display = 'flex';
            entCover.style.display = 'flex';
         });
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const element = document.getElementById('ent-cover-text');
const basis = document.getElementById('ent-cover-text-cqi');
function outputsize() {
    console.log(basis.offsetWidth, basis.offsetHeight, window.getComputedStyle(basis).fontSize,  window.getComputedStyle(element).fontSize);
    let stra = window.getComputedStyle(basis).fontSize;
    let size = stra.substring(0,2);

    if(basis.offsetHeight>=38){
        element.style.fontSize = size/1.4 + 'px';
    } else{
        element.style.fontSize = size + 'px';
    }
}

new ResizeObserver(outputsize).observe(basis)

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
var revealed = 0;
function reveal(){
    if(generated==1){
        document.getElementById("ent-album-img").style.filter = 'blur(0px)';
        if(revealed==0){
            revealed = 1;
            document.getElementById('ent-cover-button').textContent = 'INFO';
        } else{
            flip();
        }
    }
}


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
        // recommendButton: '#submit-container',
        //recommendationDiv: '#recommendation'
    }

    return {
        inputField() {
            return {
                genreSelect: document.querySelector(DOMElements.genreSelect),
                // recommendButton: document.querySelector(DOMElements.recommendButton),
                //recommendationDiv: document.querySelector(DOMElements.recommendationDiv)
            }
        },

        displayRecommendation(track) {
            const audioElement = document.getElementById('track');
            const audioSourceElement = document.getElementById('tracke');

            if(track.preview_url){
                document.getElementById("tracke").src = track.preview_url
            } else{
                console.log('No audio preview.');
                document.getElementById("ent-play-button").style.backgroundColor = 'gray';
                document.getElementById("ent-play-button").style.borderColor = 'gray';
            }

            console.log(track.preview_url)
        
            document.getElementById("ent-album-img").src = track.album.images[0].url;
            document.getElementById("ent-album-cover").alt = track.album.name;
            document.getElementById("ent-cover-text").textContent = track.name;
            document.getElementById("ent-title").textContent = track.name;
            document.getElementById("ent-artist").textContent = track.artists[0].name;
            document.getElementById("ent-album-name").textContent = track.album.name;
            document.getElementById("ent-year").textContent = track.album.release_date.split('-')[0];
            document.getElementById("ent-link-button").href = track.external_urls.spotify;

            document.getElementById("ent-cover-text-cqi").textContent = track.name;
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
        }
        const tracks = await APICtrl.getRecommendations(token, selectedGenres, 1);
        generated = 1;
        document.getElementById("ent-album-img").style.filter = 'blur(10px)';
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

    const checkAndGenerateRecommendation = () => {
        const selectedGenres = getSelectedGenres();
        if (selectedGenres.length > 0) {
            generateRecommendation();
            scheduleDailyUpdate();
            // Removes the event listener once recommendations start being generated
            DOMInputs.genreSelect.removeEventListener('change', checkAndGenerateRecommendation);
            // Add the new event listener for future changes
            DOMInputs.genreSelect.addEventListener('change', handleGenreChange);
        }
    }

    const handleGenreChange = () => {
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
            checkAndGenerateRecommendation();
            DOMInputs.genreSelect.addEventListener('change', checkAndGenerateRecommendation);

            // Check every minute if it's midnight and needs to update
            setInterval(() => {
                const now = new Date();
                if (now.getHours() === 0 && now.getMinutes() === 0) {
                    generateRecommendation();
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

// Productivity Widget
// Get all the necessary elements
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

// Function to hide all divs
function hideAllDivs() {
    prodMain.style.display = 'none';
    toDo.style.display = 'none';
    inProgress.style.display = 'none';
    done.style.display = 'none';
}

// Function to show a specific div
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

// Function to add a new task
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
}

// Function to create a new task div
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

// Event listeners for the buttons
redButton.addEventListener('click', () => showDiv(toDo));
orangeButton.addEventListener('click', () => showDiv(inProgress));
greenButton.addEventListener('click', () => showDiv(done));
whiteButton.addEventListener('click', () => showDiv(prodMain));
addButton.addEventListener('click', addTask);

// Initially show the main div
showDiv(prodMain);

// Update scroll visibility for all states initially
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

// Function to update the pie chart and task count
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
        // Reset the pie chart when there are no tasks
        pie.style.setProperty('--p1', 0);
        pie.style.setProperty('--p2', 0);
        pie.style.setProperty('--p3', 0);
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

// Initially show the main div and update the pie chart
showDiv(prodMain);
updatePieChart();

function makeDraggableOrSelectable(taskDiv) {
    if (isMobile()) {
        taskDiv.addEventListener('click', selectTask);
    } else {
        taskDiv.draggable = true;
        taskDiv.addEventListener('dragstart', dragStart);
        taskDiv.addEventListener('dragend', dragEnd);
    }
}

let selectedTask = null;

function selectTask(e) {
    if (selectedTask) {
        selectedTask.classList.remove('selected');
    }
    
    const task = e.currentTarget;
    task.classList.add('selected');
    selectedTask = task;
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

function dragOver(e) {
    e.preventDefault();
    e.target.style.transform = 'scale(1.4)';
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

// Helper function to determine where to place the dragged task
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

    // Only allow reordering if the task doesn't have a date and it's in the same container
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

// function to handle scrolling to a specific task
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
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
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