import { API_KEY, BASE_URL } from '../config/config';

export const getCurrentWeather = async (city) => {
    try {
        const response = await fetch(
            `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        if (!response.ok) {
            throw new Error('City not found');
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const getForecast = async (city) => {
    try {
        const response = await fetch(
            `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );
        if (!response.ok) {
            throw new Error('Forecast not found');
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const getWeatherByLocation = async (lat, lon) => {
    try {
        const response = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        if (!response.ok) {
            throw new Error('Location not found');
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}; 