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
}

// Function to create a new task div
function createTaskDiv() {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'tasks';
    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';
    taskDiv.appendChild(taskContent);
    return taskDiv;
}

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
}

// Event listeners for the buttons
redButton.addEventListener('click', () => showDiv(toDo));
orangeButton.addEventListener('click', () => showDiv(inProgress));
greenButton.addEventListener('click', () => showDiv(done));
deleteButton.addEventListener('click', () => showDiv(prodMain));
addButton.addEventListener('click', addTask);

// Initially show the main div
showDiv(prodMain);

// Update scroll visibility for all states initially
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

    if (totalTasks === 0) return;

    const todoPercentage = (todoTasks / totalTasks) * 100;
    const inProgressPercentage = (inProgressTasks / totalTasks) * 100;
    const donePercentage = (doneTasks / totalTasks) * 100;

    const pie = document.querySelector('.pie');
    pie.style.setProperty('--p1', todoPercentage);
    pie.style.setProperty('--p2', inProgressPercentage);
    pie.style.setProperty('--p3', donePercentage);

    // Update the task count
    const tasksText = pie.querySelector('.tasks-text');
    tasksText.innerHTML = `${todoTasks}<br>to-do`;
}

// Function to create a new task div
function createTaskDiv() {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'tasks';
    
    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';
    
    const taskWritten = document.createElement('div');
    taskWritten.className = 'task-written';
    
    const taskDate = document.createElement('div');
    taskDate.className = 'task-date';
    
    taskContent.appendChild(taskWritten);
    taskContent.appendChild(taskDate);
    taskDiv.appendChild(taskContent);
    
    return taskDiv;
}

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

    updatePieChart();
}

// Event listeners for the buttons
redButton.addEventListener('click', () => { showDiv(toDo); updatePieChart(); });
orangeButton.addEventListener('click', () => { showDiv(inProgress); updatePieChart(); });
greenButton.addEventListener('click', () => { showDiv(done); updatePieChart(); });
deleteButton.addEventListener('click', () => showDiv(prodMain));
addButton.addEventListener('click', addTask);

// Initially show the main div and update the pie chart
showDiv(prodMain);
updatePieChart();

