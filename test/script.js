const APIController = (function() {
    const _getEvents = async (type, month, day) => {
        try {
            const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/${type}/${month}/${day}`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'On This Day in History/1.0 jarron.decrepito26@gmail.com'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data[type];
        } catch (error) {
            console.error("Error fetching events:", error);
            return [];
        }
    }

    return {
        getEvents(type, month, day) {
            return _getEvents(type, month, day);
        }
    }
})();

const UIController = (function() {
    const DOMElements = {
        onThisDay: '#onThisDay',
        date: '#date',
        year: '#year',
        category: '#category',
        eventText: '#eventText'
    }

    return {
        getDOMElements() {
            return {
                onThisDay: document.querySelector(DOMElements.onThisDay),
                date: document.querySelector(DOMElements.date),
                year: document.querySelector(DOMElements.year),
                category: document.querySelector(DOMElements.category),
                eventText: document.querySelector(DOMElements.eventText)
            }
        },

        displayEvent(event, category) {
            const elements = this.getDOMElements();
            elements.year.textContent = event.year;
            elements.eventText.textContent = event.text;
            elements.category.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        },

        setDate(month, day) {
            const elements = this.getDOMElements();
            const date = new Date(2000, month - 1, day);
            elements.date.textContent = date.toLocaleString('en-US', { month: 'long', day: 'numeric' }) + ',';
        }
    }
})();

const APPController = (function(UICtrl, APICtrl) {
    const DOMElements = UICtrl.getDOMElements();
    const eventTypes = ['events', 'births', 'deaths', 'holidays'];
    let currentTypeIndex = 0;

    const getCurrentDate = () => {
        const today = new Date();
        return {
            month: String(today.getMonth() + 1).padStart(2, '0'),
            day: String(today.getDate()).padStart(2, '0')
        };
    }

    const generateEvent = async () => {
        const { month, day } = getCurrentDate();
        UICtrl.setDate(month, day);
        
        let eventType = eventTypes[currentTypeIndex];
        let displayCategory = eventType;
    
        // If the current type is 'events', randomly choose between 'events' and 'selected'
        if (eventType === 'events') {
            eventType = Math.random() < 0.5 ? 'events' : 'selected';
            displayCategory = 'Events';
        }
    
        const events = await APICtrl.getEvents(eventType, month, day);
        
        if (events && events.length > 0) {
            const randomEvent = events[Math.floor(Math.random() * events.length)];
            UICtrl.displayEvent(randomEvent, displayCategory);
        } else {
            UICtrl.displayEvent({ year: 'N/A', text: 'No event found for this category.' }, displayCategory);
        }
    }

    const setupEventListeners = () => {
        DOMElements.onThisDay.addEventListener('click', () => {
            currentTypeIndex = (currentTypeIndex + 1) % eventTypes.length;
            generateEvent();
        });
    }

    return {
        init() {
            console.log('On This Day in History App is starting');
            setupEventListeners();
            generateEvent();
        }
    }
})(UIController, APIController);

document.addEventListener('DOMContentLoaded', function() {
    APPController.init();
});