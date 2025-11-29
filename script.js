const API_KEY = 'f14a962b738ce850ae61fa2e34a19f98';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

const elements = {
    cityName: document.getElementById('cityName'),
    countryCode: document.getElementById('countryCode'),
    mainTemp: document.getElementById('mainTemp'),
    mainCondition: document.getElementById('mainCondition'),
    dateTime: document.getElementById('dateTime'),
    mainIcon: document.getElementById('mainIcon'),
    precipitation: document.getElementById('precipitation'),
    humidity: document.getElementById('humidity'),
    wind: document.getElementById('wind'),
    forecastList: document.getElementById('forecastList'),
    changeLocationBtn: document.getElementById('changeLocationBtn'),
    locationModal: document.getElementById('locationModal'),
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    cancelBtn: document.getElementById('cancelBtn')
};

const weatherIcons = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Smoke: '🌫️',
    Haze: '🌫️',
    Fog: '🌫️'
};

function updateDateTime() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    elements.dateTime.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

async function getUserLocation() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.city) {
            await fetchWeatherData(data.city);
            return;
        }
    } catch (err) {
        console.error('IP lookup failed:', err);
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
            },
            () => fetchWeatherData('Bishkek')
        );
    } else {
        fetchWeatherData('Bishkek');
    }
}

async function fetchWeatherData(city) {
    try {
        const currentRes = await fetch(`${API_URL}?q=${city}&appid=${API_KEY}&units=metric`);
        if (!currentRes.ok) throw new Error('City not found');
        const currentData = await currentRes.json();

        const forecastRes = await fetch(`${FORECAST_URL}?q=${city}&appid=${API_KEY}&units=metric`);
        const forecastData = await forecastRes.json();

        updateWeatherDisplay(currentData, forecastData);
        localStorage.setItem('savedCity', currentData.name);
    } catch (err) {
        alert('Error fetching weather: ' + err.message);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        const currentRes = await fetch(`${API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const currentData = await currentRes.json();

        const forecastRes = await fetch(`${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const forecastData = await forecastRes.json();

        updateWeatherDisplay(currentData, forecastData);
        localStorage.setItem('savedCity', currentData.name);
    } catch (err) {
        alert('Error fetching weather');
    }
}

function updateWeatherDisplay(current, forecast) {
    elements.cityName.textContent = current.name;
    elements.countryCode.textContent = current.sys.country;
    elements.mainTemp.textContent = `${Math.round(current.main.temp)}°`;
    elements.mainCondition.textContent = current.weather[0].main;
    elements.mainIcon.textContent = weatherIcons[current.weather[0].main] || '☁️';
    elements.precipitation.textContent = `${current.clouds.all || 0}%`;
    elements.humidity.textContent = `${current.main.humidity}%`;
    elements.wind.textContent = `${Math.round(current.wind.speed * 3.6)} km/h`;

    updateForecast(forecast.list);
}

function updateForecast(forecastList) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyData = {};

    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayName = days[date.getDay()];
        const hour = date.getHours();

        if (!dailyData[dayName] || Math.abs(hour - 12) < Math.abs(dailyData[dayName].hour - 12)) {
            dailyData[dayName] = {
                day: dayName,
                temp: Math.round(item.main.temp),
                condition: item.weather[0].main,
                hour: hour
            };
        }
    });

    const forecastItems = Object.values(dailyData).slice(1, 6);
    elements.forecastList.innerHTML = forecastItems.map(item => `
        <div class="forecast-item">
            <div class="forecast-day">${item.day}</div>
            <div class="forecast-icon">${weatherIcons[item.condition] || '☁️'}</div>
            <div class="forecast-temp">${item.temp}°C</div>
        </div>
    `).join('');
}

function openModal() {
    elements.locationModal.classList.add('active');
    elements.cityInput.focus();
}

function closeModal() {
    elements.locationModal.classList.remove('active');
    elements.cityInput.value = '';
}

async function handleSearch() {
    const city = elements.cityInput.value.trim();
    if (!city) return alert('Please enter a city name');
    await fetchWeatherData(city);
    closeModal();
}

elements.changeLocationBtn.addEventListener('click', openModal);
elements.cancelBtn.addEventListener('click', closeModal);
elements.searchBtn.addEventListener('click', handleSearch);
elements.cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
elements.locationModal.addEventListener('click', (e) => {
    if (e.target === elements.locationModal) closeModal();
});

updateDateTime();
setInterval(updateDateTime, 60000);

const savedCity = localStorage.getItem('savedCity');
if (savedCity) {
    fetchWeatherData(savedCity);
} else {
    getUserLocation();
}