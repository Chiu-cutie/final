// Replace with your Google Apps Script Web App URL
const API_URL = 'https://script.google.com/macros/s/AKfycbziGdLmHYd2ZUPFScqyT2d_PWbiOXENarqWByrrNvNQbko0mD7Y2x2r0Z2SOkxFI764Gw/exec';

// DOM Elements
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-links a');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-links');
const menuItemsContainer = document.getElementById('menu-items-container');
const menuFilters = document.querySelectorAll('.filter-btn');
const contactDetails = document.getElementById('contact-details');
const messageForm = document.getElementById('message-form');

// Current active page
let currentPage = 'home';

// Initialize the app
function init() {
    setupEventListeners();
    loadPageData();
}

// Page navigation handler
document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', function(e) {
        e.preventDefault();
        const targetPage = this.getAttribute('data-page');
        navigateTo(targetPage);
    });
});

// Set up event listeners
function setupEventListeners() {
    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            navigateTo(page);
        });
    });

    // Hamburger menu
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Menu filter buttons
    menuFilters.forEach(button => {
        button.addEventListener('click', () => {
            menuFilters.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const category = button.getAttribute('data-category');
            filterMenuItems(category);
        });
    });

    // Message form submission
    if (messageForm) {
        messageForm.addEventListener('submit', handleFormSubmit);
    }

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-links li a').forEach(item => {
        item.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// Navigate to a specific page
function navigateTo(page) {
    // Update current page
    currentPage = page;

    // Update active page
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(page).classList.add('active');

    // Update active nav link
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });

    // Load data for the page if needed
    loadPageData();
}

// Load data for the current page
function loadPageData() {
    switch (currentPage) {
        case 'menu':
            loadMenuItems();
            break;
        case 'contact':
            loadContactInfo();
            break;
    }
}

// Load menu items from Google Sheets
async function loadMenuItems() {
    try {
        menuItemsContainer.innerHTML = '<div class="loading-spinner"></div>';
        
        const response = await fetchWithRetry(`${API_URL}?action=getMenu`);
        const data = await response.json();
        
        if (data.status === 'success') {
            renderMenuItems(data.data);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading menu items:', error);
        menuItemsContainer.innerHTML = `
            <div class="error-message">
                <p>Failed to load menu items. Please try again later.</p>
            </div>
        `;
    }
}

// Render menu items
function renderMenuItems(items) {
    if (items.length === 0) {
        menuItemsContainer.innerHTML = '<p>No menu items available.</p>';
        return;
    }

    menuItemsContainer.innerHTML = items.map(item => `
        <div class="menu-item" data-category="${item.category.toLowerCase()}">
            <div class="menu-item-image" style="background-image: url('${item.image || ''}')"></div>
            <div class="menu-item-content">
                <div class="menu-item-title">
                    <h3>${item.name}</h3>
                    <span class="menu-item-price">₹${item.price}</span>
                </div>
                <span class="menu-item-category">${item.category}</span>
                <p>${item.description}</p>
            </div>
        </div>
    `).join('');
}

// Filter menu items by category
function filterMenuItems(category) {
    const allItems = document.querySelectorAll('.menu-item');
    
    allItems.forEach(item => {
        if (category === 'all' || item.getAttribute('data-category') === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Load contact info from Google Sheets
async function loadContactInfo() {
    try {
        contactDetails.innerHTML = '<div class="loading-spinner"></div>';
        
        const response = await fetchWithRetry(`${API_URL}?action=getContact`);
        const data = await response.json();
        
        if (data.status === 'success') {
            renderContactInfo(data.data);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading contact info:', error);
        contactDetails.innerHTML = `
            <div class="error-message">
                <p>Failed to load contact information. Please try again later.</p>
            </div>
        `;
    }
}

// Render contact info
function renderContactInfo(info) {
    contactDetails.innerHTML = `
        <div class="contact-detail">
            <i class="fas fa-map-marker-alt"></i>
            <p>${info.address}</p>
        </div>
        <div class="contact-detail">
            <i class="fas fa-phone"></i>
            <p>${info.phone}</p>
        </div>
        <div class="contact-detail">
            <i class="fas fa-envelope"></i>
            <p>${info.email}</p>
        </div>
        <div class="contact-detail">
            <i class="fas fa-clock"></i>
            <p>${info.hours}</p>
        </div>
    `;
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Gather form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
    };

    try {
        // Show loading state
        const submitBtn = messageForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        // Send data to Google Apps Script
        const response = await fetchWithRetry(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({...formData, action: 'submitForm'})
        });
        
        const data = await response.json();
        
        // Handle server response
        if (data.status === 'success') {
            alert('Thank you for your message! We will get back to you soon.');
            messageForm.reset();
        } else {
            throw new Error(data.message || 'Unknown error occurred');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('There was an error sending your message. Please try again later.');
    } finally {
        // Reset button state
        const submitBtn = messageForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
    }
}

// Enhanced fetch with retry logic and CORS handling
async function fetchWithRetry(url, options = {}, retries = 3) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response;
    } catch (error) {
        if (retries <= 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchWithRetry(url, options, retries - 1);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);