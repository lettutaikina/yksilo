// ./src/main.ts

// Import statements for necessary modules and components
import { errorModal, restaurantModal, restaurantRow } from './components';
import { fetchData } from './functions';
import { Restaurant } from './interfaces/Restaurant';
import { apiUrl, positionOptions } from './variables';
import './main.css';
import { Menu } from './interfaces/Menu';

// Ensure the presence of the modal element
const modal = document.querySelector('dialog');
if (!modal) {
  throw new Error('Modal not found');
}

// Event listener to close the modal when clicked
modal.addEventListener('click', () => {
  modal.close();
});

// Function to calculate distance between two coordinates
const calculateDistance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

// Function to create and populate the table of restaurants
const createTable = async (restaurants: Restaurant[], menuType: string) => {
  const table = document.querySelector('table');
  if (!table) {
    throw new Error('Table not found');
  }
  table.innerHTML = '';

  // Iterate over each restaurant
  for (const restaurant of restaurants) {
    const tr = restaurantRow(restaurant);
    table.appendChild(tr);

    // Event listener for when a restaurant row is clicked
    tr.addEventListener('click', async () => {
      try {
        document.querySelectorAll('.highlight').forEach((high) => {
          high.classList.remove('highlight');
        });

        tr.classList.add('highlight');

        // Fetch the weekly menu regardless of the selected menu type
        const menu = await fetchData<Menu>(
          apiUrl + `/restaurants/weekly/${restaurant._id}/fi`
        );

        console.log('Fetched Weekly Menu:', menu);

        modal.innerHTML = '';

        // Log the structure of the fetched menu
        console.log('Menu Structure:', JSON.stringify(menu));

        // Check if menu.days is defined before iterating
        if (menu.days) {
          // Iterate over each day in the menu
          menu.days.forEach((day) => {
            // Create HTML for each day
            const dayHtml = `
              <h4>${day.date}</h4>
              <table>
                <tr>
                  <th>Course</th>
                  <th>Diet</th>
                  <th>Price</th>
                </tr>
                ${day.courses.map((course) => `
                  <tr>
                    <td>${course.name}</td>
                    <td>${Array.isArray(course.diets) ? course.diets.join(', ') : ' - '}</td>
                    <td>${course.price || ' - '}</td>
                  </tr>
                `).join('')}
              </table>
            `;

            // Append HTML for each day to the modal
            modal.insertAdjacentHTML('beforeend', dayHtml);
          });
        } else {
          // Handle the case where menu.days is undefined
          modal.innerHTML = errorModal('Menu data is missing or invalid.');
        }

        modal.showModal();
      } catch (error) {
        console.error('Error fetching or rendering weekly menu:', error);
        modal.innerHTML = errorModal((error as Error).message);
        modal.showModal();
      }
    });
  }
};

// Function to handle geolocation errors
const error = (err: GeolocationPositionError) => {
  console.warn(`ERROR(${err.code}): ${err.message}`);
};

// Function to handle successful geolocation
const success = async (pos: GeolocationPosition) => {
  try {
    const crd = pos.coords;
    // Fetch the list of restaurants
    const restaurants = await fetchData<Restaurant[]>(apiUrl + '/restaurants');
    console.log('Fetched Restaurants:', restaurants);

    // Sort restaurants based on distance from the user's location
    restaurants.sort((a, b) => {
      const x1 = crd.latitude;
      const y1 = crd.longitude;
      const x2a = a.location.coordinates[1];
      const y2a = a.location.coordinates[0];
      const distanceA = calculateDistance(x1, y1, x2a, y2a);
      const x2b = b.location.coordinates[1];
      const y2b = b.location.coordinates[0];
      const distanceB = calculateDistance(x1, y1, x2b, y2b);
      return distanceA - distanceB;
    });

    // Default to daily menu type
    const defaultMenuType = 'daily';
    await createTable(restaurants, defaultMenuType);

    // Rest of your code...
  } catch (error) {
    console.error('Error fetching or rendering restaurants:', error);
    modal.innerHTML = errorModal((error as Error).message);
    modal.showModal();
  }
};

// Use geolocation to get the user's position
navigator.geolocation.getCurrentPosition(success, error, positionOptions);

// ... (The rest
