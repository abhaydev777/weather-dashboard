import React, { useState, useEffect, useRef } from 'react';
import { getCurrentWeather, getForecast, getWeatherByLocation } from './services/weatherService';
import { WEATHER_ICON_URL } from './config/config';
import { worldCities } from './data/cities';

// Popular cities list for suggestions
const popularCities = [
  'London', 'New York', 'Tokyo', 'Paris', 'Dubai', 
  'Singapore', 'Barcelona', 'Mumbai', 'Sydney', 'Toronto',
  'Berlin', 'Istanbul', 'Bangkok', 'Rome', 'Amsterdam',
  'Delhi', 'Moscow', 'Seoul', 'Madrid', 'Hong Kong'
];

const App = () => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [city, setCity] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [unit, setUnit] = useState('C');
  const [darkMode, setDarkMode] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favoritesCities');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('favoritesCities', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  const handleThemeToggle = () => {
    setIsRotating(true);
    setDarkMode(!darkMode);
    setTimeout(() => setIsRotating(false), 700); // Match the animation duration
  };

  const convertTemp = (temp, to) => {
    if (to === 'F') {
      return (temp * 9/5) + 32;
    }
    return temp;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const toggleFavorite = (cityName) => {
    if (favorites.includes(cityName)) {
      setFavorites(favorites.filter(city => city !== cityName));
    } else {
      setFavorites([...favorites, cityName]);
    }
  };

  const handleCityInput = (e) => {
    const input = e.target.value;
    setCity(input);
    
    if (input.trim().length > 0) {
      // Combine all available cities with priority order
      const allCities = [...new Set([
        ...recentSearches,      // Recent searches first
        ...favorites,           // Then favorites
        ...worldCities         // Then all world cities
      ])];
      
      // Filter cities based on input with smarter matching
      const filtered = allCities
        .filter(city => {
          const cityLower = city.toLowerCase();
          const inputLower = input.toLowerCase();
          
          // Exact match gets highest priority
          if (cityLower === inputLower) return true;
          
          // Starts with input gets second priority
          if (cityLower.startsWith(inputLower)) return true;
          
          // Contains input gets third priority
          if (cityLower.includes(inputLower)) return true;
          
          return false;
        })
        .slice(0, 8); // Show more suggestions (8 instead of 5)
      
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = async (selectedCity) => {
    await fetchWeatherData(selectedCity);
    setIsSearchFocused(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    await fetchWeatherData(city);
  };

  const fetchWeatherData = async (cityName) => {
    setLoading(true);
    setError(null);
    try {
      const weatherData = await getCurrentWeather(cityName);
      const forecastData = await getForecast(cityName);
      setWeather(weatherData);
      setForecast(forecastData);
      // Add to recent searches before clearing the input
      setRecentSearches(prev => {
        const updated = [cityName, ...prev.filter(city => city !== cityName)].slice(0, 5);
        return updated;
      });
      setCity(''); // Clear the input after adding to recent searches
      setSuggestions([]); // Clear suggestions
    } catch (err) {
      setError(
        err.message === 'City not found' 
          ? `Unable to find "${cityName}". Please check the spelling and try again.` 
          : 'Error fetching weather data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLocationWeather = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          setLoading(true);
          const weatherData = await getWeatherByLocation(
            position.coords.latitude,
            position.coords.longitude
          );
          const forecastData = await getForecast(weatherData.name); // Add forecast data
          setWeather(weatherData);
          setForecast(forecastData);
        } catch (err) {
          setError(
            err.message === 'City not found' 
              ? 'Unable to find weather data for your location. Please try searching for a city instead.' 
              : 'Error fetching weather data. Please try again.'
          );
        } finally {
          setLoading(false);
        }
      }, () => {
        setError('Location access denied. Please enable location access or search for a city manually.');
      });
    } else {
      setError('Geolocation is not supported by your browser. Please search for a city manually.');
    }
  };

  const getWeatherBackground = (weatherCode) => {
    if (!weatherCode) return 'weather-card-cloudy';
    if (weatherCode.includes('clear')) return 'weather-card-sunny';
    if (weatherCode.includes('rain') || weatherCode.includes('drizzle')) return 'weather-card-rainy';
    return 'weather-card-cloudy';
  };

  return (
    <div className={`min-h-screen p-2 sm:p-4 theme-transition ${
      darkMode ? 'bg-gradient-dark dark' : 'bg-gradient-light'
    }`}>
      <div className="max-w-4xl mx-auto animate-fade-in theme-transition">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg text-center sm:text-left">
            Weather Dashboard
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleThemeToggle}
              className={`p-2 sm:p-3 rounded-full hover-scale ${
                darkMode ? 'glass-dark text-white' : 'glass text-gray-800'
              } shadow-lg theme-transition ${isRotating ? 'mode-switch-rotate' : ''}`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
              className={`px-3 sm:px-4 py-2 rounded-full hover-scale ${
                darkMode ? 'glass-dark text-white' : 'glass text-gray-800'
              } shadow-lg font-semibold theme-transition`}
            >
              °{unit === 'C' ? 'F' : 'C'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="search-container mb-6 sm:mb-8">
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSearch(e);
            setSuggestions([]);
            setIsSearchFocused(false);
          }}>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={city}
                  onChange={handleCityInput}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 300)}
                  placeholder="Enter city name..."
                  className={`w-full p-3 sm:p-4 rounded-full focus:ring-4 focus:ring-blue-500 outline-none theme-transition ${
                    darkMode 
                      ? 'glass-dark text-white placeholder-gray-400' 
                      : 'glass text-gray-800 placeholder-gray-500'
                  } shadow-lg`}
                />
                
                {/* Suggestions */}
                {suggestions.length > 0 && isSearchFocused && (
                  <div className="search-suggestions w-full">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSuggestionClick(suggestion);
                        }}
                        className="suggestion-item text-sm sm:text-base"
                      >
                        <span className="text-base sm:text-lg">🏙️</span>
                        <span className="font-medium">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  type="submit" 
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full hover-scale transition-all duration-300 shadow-lg font-semibold text-sm sm:text-base"
                >
                  Search
                </button>
                <button 
                  type="button" 
                  onClick={handleLocationWeather}
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full hover-scale transition-all duration-300 shadow-lg font-semibold text-sm sm:text-base whitespace-nowrap"
                >
                  📍 My Location
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Main Content */}
        <div className="content-section">
          {/* Favorites */}
          {favorites.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <div className={`p-4 sm:p-6 rounded-xl theme-transition ${
                darkMode ? 'dark-card' : 'glass'
              }`}>
                <h3 className="text-base sm:text-lg font-semibold mb-4 drop-shadow-md">Favorite Cities</h3>
                <div className="flex flex-wrap gap-2">
                  {favorites.map((favCity) => (
                    <button
                      key={favCity}
                      onClick={() => fetchWeatherData(favCity)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base transition-all duration-300 hover-scale shadow-md
                        ${darkMode 
                          ? 'bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70' 
                          : 'bg-white bg-opacity-70 text-gray-800 hover:bg-opacity-90'
                        }`}
                    >
                      {favCity}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={`border-2 px-4 sm:px-6 py-3 sm:py-4 rounded-xl mb-4 animate-fade-in shadow-lg font-medium theme-transition text-sm sm:text-base ${
              darkMode 
                ? 'bg-red-900 bg-opacity-50 border-red-500 text-red-100' 
                : 'bg-red-100 border-red-400 text-red-800'
            }`}>
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center h-32 animate-fade-in">
              <div className={`loading-ring w-16 h-16 rounded-full animate-spin theme-transition ${
                darkMode ? 'border-blue-400' : 'border-blue-600'
              }`}></div>
            </div>
          )}

          {/* Weather Display */}
          {weather && (
            <div className={`p-4 sm:p-8 rounded-xl shadow-xl mb-6 sm:mb-8 animate-fade-in theme-transition ${
              darkMode ? 'dark-card' : getWeatherBackground(weather.weather[0].main.toLowerCase())
            }`}>
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">{weather.name}</h2>
                <button
                  onClick={() => toggleFavorite(weather.name)}
                  className="text-2xl sm:text-3xl hover-scale transition-transform duration-300 text-white drop-shadow-lg"
                >
                  {favorites.includes(weather.name) ? '⭐' : '☆'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="flex items-center justify-center sm:justify-start">
                  <img 
                    src={`${WEATHER_ICON_URL}/${weather.weather[0].icon}@2x.png`}
                    alt={weather.weather[0].description}
                    className="w-20 h-20 sm:w-24 sm:h-24 weather-icon-float drop-shadow-lg"
                  />
                  <div>
                    <p className="text-4xl sm:text-5xl font-bold text-white mb-1 sm:mb-2 drop-shadow-lg">
                      {Math.round(convertTemp(weather.main.temp, unit))}°{unit}
                    </p>
                    <p className="text-lg sm:text-xl text-white capitalize drop-shadow-md">
                      {weather.weather[0].description}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:gap-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="weather-info-card p-3 sm:p-4 rounded-lg shadow-lg backdrop-blur-sm">
                      <p className="flex items-center text-white">
                        <span className="mr-2 text-xl sm:text-2xl drop-shadow-md">💧</span>
                        <span className="text-base sm:text-lg font-semibold">{weather.main.humidity}%</span>
                      </p>
                      <p className="text-white text-xs sm:text-sm mt-1 font-medium">Humidity</p>
                    </div>
                    <div className="weather-info-card p-3 sm:p-4 rounded-lg shadow-lg backdrop-blur-sm">
                      <p className="flex items-center text-white">
                        <span className="mr-2 text-xl sm:text-2xl drop-shadow-md">💨</span>
                        <span className="text-base sm:text-lg font-semibold">{weather.wind.speed} m/s</span>
                      </p>
                      <p className="text-white text-xs sm:text-sm mt-1 font-medium">Wind Speed</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="weather-info-card p-3 sm:p-4 rounded-lg shadow-lg backdrop-blur-sm">
                      <p className="flex items-center text-white">
                        <span className="mr-2 text-base sm:text-lg drop-shadow-md">🌅</span>
                        <span className="text-sm sm:text-base font-semibold">{formatTime(weather.sys.sunrise)}</span>
                      </p>
                      <p className="text-white text-xs sm:text-sm mt-1 font-medium">Sunrise</p>
                    </div>
                    <div className="weather-info-card p-3 sm:p-4 rounded-lg shadow-lg backdrop-blur-sm">
                      <p className="flex items-center text-white">
                        <span className="mr-2 text-base sm:text-lg drop-shadow-md">🌇</span>
                        <span className="text-sm sm:text-base font-semibold">{formatTime(weather.sys.sunset)}</span>
                      </p>
                      <p className="text-white text-xs sm:text-sm mt-1 font-medium">Sunset</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forecast Display */}
          {forecast && (
            <div className={`p-4 sm:p-6 rounded-xl shadow-xl animate-fade-in theme-transition ${
              darkMode ? 'dark-card' : 'glass'
            }`}>
              <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 drop-shadow-md">5-Day Forecast</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                {forecast.list
                  .filter((item, index) => index % 8 === 0)
                  .map((item, index) => (
                    <div 
                      key={index} 
                      className={`weather-info-card p-3 sm:p-4 rounded-lg hover-scale transition-all duration-300 shadow-lg backdrop-blur-sm text-center`}
                    >
                      <p className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">
                        {new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <img 
                        src={`${WEATHER_ICON_URL}/${item.weather[0].icon}@2x.png`}
                        alt={item.weather[0].description}
                        className="w-12 h-12 sm:w-16 sm:h-16 mx-auto weather-icon-float drop-shadow-lg"
                      />
                      <p className="text-lg sm:text-xl font-bold mt-1 sm:mt-2">
                        {Math.round(convertTemp(item.main.temp, unit))}°{unit}
                      </p>
                      <p className="text-xs sm:text-sm font-medium capitalize">
                        {item.weather[0].description}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;