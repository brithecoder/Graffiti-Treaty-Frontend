import { useState } from "react";

export function useLocalStorage(key, initialValue) {
  // 1. Initialize state with value from localStorage or initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`LocalStorage Read Error (Key: ${key}):`, error);
      return initialValue;
    }
  });

  // 2. Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value) => {
    try {
      // Allow value to be a function so it matches the useState API
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`LocalStorage Write Error (Key: ${key}):`, error);
    }
  };

  return [storedValue, setValue];
}