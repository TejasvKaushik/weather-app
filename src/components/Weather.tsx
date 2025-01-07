import { useEffect, useRef, useState } from 'react'
import './Weather.css'
import search_icon from '../assets/search.svg'
import cloud_sunny from '../assets/cloud-sunny.svg'
import cloud from '../assets/cloud.svg'
import heavy_rain from '../assets/heavy-rain.svg'
import rain from '../assets/rain.svg'
import snow from '../assets/snow.svg'
import sun_light from '../assets/sun-light.svg'
import thunderstorm from '../assets/thunderstorm.svg'
import humidity from '../assets/menu.svg'
import wind from '../assets/wind.svg'
import map_pin from '../assets/map-pin.svg'

const Weather = () => {

    const inputCity = useRef<HTMLInputElement | null>(null);

    const [weatherData, setWeatherData] = useState<{
        humidity: number;
        temp: number;
        windSpeed: number;
        place: string;
        icon: string;
        unit: 'C' | 'F';
    } | null>(null);

    const [forecastData, setForecastData] = useState<any[]>([]);

    const iconMap: { [key: string]: string } = {
        "01d": sun_light,
        "01n": sun_light,
        "02d": cloud_sunny,
        "02n": cloud_sunny,
        "03d": cloud,
        "03n": cloud,
        "04d": rain,
        "04n": rain,
        "09d": heavy_rain,
        "09n": heavy_rain,
        "10d": heavy_rain,
        "10n": heavy_rain,
        "11d": thunderstorm,
        "11n": thunderstorm,
        "13d": snow,
        "13n": snow,
    };

    const fetchData = async (city_name: string, lat?: number, long?: number) => {
        try {
            const API_KEY = import.meta.env.VITE_API_KEY;
            let URL = "";

            if (lat && long) {
                URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&units=metric&appid=${API_KEY}`;
            }
            else {
                URL = `https://api.openweathermap.org/data/2.5/weather?q=${city_name}&units=metric&appid=${API_KEY}`;
            }

            const apiResponse = await fetch(URL);
            const data = await apiResponse.json();

            if (!apiResponse.ok) {
                alert(data.message);
                return;
            }

            console.log(data);

            const iconCode = data.weather?.[0]?.icon;
            const icon = iconCode ? iconMap[iconCode] || sun_light : sun_light;
            setWeatherData({
                humidity: data.main?.humidity || 0,
                temp: Math.floor(data.main?.temp || 0),
                windSpeed: data.wind?.speed || 0,
                place: data.name || "Unknown location",
                icon: icon,
                unit: 'C'
            });

            fetchForecastData(city_name, lat, long);
        } catch (error) {
            console.error("Error fetching weather data:", error);
            setWeatherData(null);
            alert("Failed to fetch weather data. Please check your internet connection or try again.");
        }
    }

    const fetchForecastData = async (city: string, lat: any, lon: any) => {
        try {
            const API_KEY = import.meta.env.VITE_API_KEY;
            let URL = "";
            if (lat && lon) {
                URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
            }
            else {
                URL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`;
            }
            const apiResponse = await fetch(URL);
            const data = await apiResponse.json();

            console.log("!!!!!!!!!!!!!");
            console.log(data);

            if (!apiResponse.ok) {
                alert(data.message);
                return;
            }

            // Process data to get daily forecast
            const dailyForecast = data.list.filter((_item: any, index: number) => index % 8 === 0); // Every 8th entry is a new day
            setForecastData(dailyForecast);
        } catch (error) {
            console.error("Error fetching forecast data:", error);
        }
    };


    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    fetchData("", latitude, longitude);
                },
                () => {
                    alert("Failed to retrieve your location.");
                    fetchData("London"); // Default city if location fails
                }
            )
        } else {
            alert("Geolocation is not supported by this browser.");
            fetchData("London"); // Default city if geolocation is not supported
        }
    }

    const toggleUnit = () => {
        if (!weatherData) return;

        const newUnit = weatherData.unit === 'C' ? 'F' : 'C';
        const newTemp =
            newUnit === 'F'
                ? (weatherData.temp * 9) / 5 + 32
                : (weatherData.temp - 32) * (5 / 9);

        setWeatherData({
            ...weatherData,
            temp: Math.round(newTemp), // Set the new temperature value
            unit: newUnit, // Update the unit state
        });
    };


    useEffect(() => {
        fetchData("London")
    }, [])
    return (
        <div className='weather'>
            <div className="search-bar">
                <input ref={inputCity} type="text" placeholder='Search' onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        const city = inputCity.current?.value || "";
                        fetchData(city)
                    }
                }} />
                <img src={search_icon} className='search-icon' alt="" onClick={() => {
                    const city = inputCity.current?.value || "";
                    fetchData(city)
                }} />

                <img src={map_pin} className='search-icon' alt="" onClick={() => getUserLocation()} />

                <button onClick={toggleUnit} className='toggle-button'>
                    {weatherData?.unit === 'C' ? '°C' : '°F'}
                </button>

            </div>
            {weatherData ?
                <>
                    <div className="weather-info">
                        <img src={weatherData?.icon} alt="" className='weather-icon' />
                        <p className='temp'>{weatherData?.temp} °{weatherData.unit}</p>
                    </div>
                    <p className='place'>{weatherData?.place}</p>

                    <div className="weather-data">
                        <div className="col">
                            <img src={humidity} alt="" />
                            <div>
                                <p>{weatherData?.humidity}%</p>
                                <span>Humidity</span>
                            </div>
                        </div>

                        <div className="col">
                            <img src={wind} alt="" />
                            <div>
                                <p>{weatherData?.windSpeed} kmph</p>
                                <span>Wind Speed</span>
                            </div>
                        </div>
                    </div>

                    <div className="forecast">
                        <h3>5-Day Forecast</h3>
                        <div className="forecast-items">
                            {forecastData.map((item, index) => {
                                const date = new Date(item.dt * 1000); // Convert from Unix timestamp
                                const day = date.toLocaleDateString('en-US', { weekday: 'short' });
                                const temp = weatherData?.unit === 'C' ? item.main.temp : (item.main.temp * 9) / 5 + 32;
                                return (
                                    <div key={index} className="forecast-item">
                                        <p>{day}</p>
                                        <img src={iconMap[item.weather[0].icon] || sun_light} alt="" />
                                        <p>{Math.round(temp)} °{weatherData?.unit}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </> : <></>}
        </div>
    )
}

export default Weather