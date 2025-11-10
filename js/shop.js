// === GLOBAL STATE ===
const API_URL = 'https://vardhan-wears-api.onrender.com';
let token = localStorage.getItem('token');
let allProducts = [];
let allCategories = [];
let categoryParentMap = new Map();

// === UI ELEMENTS ===
const menuBtn = document.getElementById('menu-btn');
const mobileNavLinks = document.getElementById('mobile-nav-links');
const productList = document.getElementById('product-list');
const pageLoader = document.getElementById('page-loader');
const pageTitle = document.getElementById('page-title');
const noProductsMessage = document.getElementById('no-products-message');
const parentCategoryFilter = document.getElementById('parent-category-filter');
const childCategoryFilter = document.getElementById('child-category-filter');
const applyFilterBtn = document.getElementById('apply-filter-btn'); // New Button


// --- MENU TOGGLES (for Header) ---
menuBtn.addEventListener('click', () => {
    mobileNavLinks.classList.toggle('hidden');
});

function toggleDesktopMenu() {
    document.getElementById('desktop-menu-dropdown').classList.toggle('hidden');
}
window.toggleDesktopMenu = toggleDesktopMenu; // Make globally accessible

window.onclick = function(event) {
    if (!event.target.matches('#desktop-menu-btn') && !event.target.closest('#desktop-menu-btn')) {
        const dropdown = document.getElementById('desktop-menu-dropdown');
        if (dropdown && !dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
        }
    }
}

// --- AUTH LOGIC (for Header) ---
async function checkAuth() {
    token = localStorage.getItem('token'); 
    const desktopDropdown = document.getElementById('desktop-menu-dropdown');
    const mobileNav = document.getElementById('mobile-nav-links');
    
    let desktopLinks = '';
    let mobileLinks = '';

    // --- FIXED: Removed "View All Products" and parent categories ---
    mobileLinks = `
        <a href="index.html" class="block py-2 px-6 text-sm text-gray-700 hover:bg-gray-100">Home</a>
        <hr class="my-1 border-gray-100">
        <a href="index.html#about" class="block py-2 px-6 text-sm text-gray-700 hover:bg-gray-100">About</a>
        <a href="index.html#contact" class="block py-2 px-6 text-sm text-gray-700 hover:bg-gray-100">Contact</a>
        <hr class="my-1 border-gray-100">
    `;
    
    // --- FIXED: Removed "All Products" ---
    desktopLinks = `
        <a href="index.html#about" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">About</a>
        <a href="index.html#contact" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Contact</a>
        <hr class="my-1 border-gray-100">
    `;

    if (!token) {
        desktopLinks += `
            <a href="login.html" class="block px-4 py-2 text-sm text-pink-600 font-bold hover:bg-pink-50">Login</a>
            <a href="register.html" class="block px-4 py-2 text-sm text-pink-600 font-bold hover:bg-pink-50">Register</a>
        `;
        mobileLinks += `
            <a href="login.html" class="block py-2 px-6 text-sm text-pink-600 font-bold hover:bg-pink-50">Login</a>
            <a href="register.html" class="block py-2 px-6 text-sm text-pink-600 font-bold hover:bg-pink-50">Register</a>
        `;
    } else {
        try {
            const res = await fetch(`${API_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                localStorage.removeItem('token');
                checkAuth(); 
                return;
            }
            const user = await res.json();
            
            desktopLinks += `
                <a href="profile.html" class="flex items-center px-4 py-2 text-sm text-blue-600 font-medium hover:bg-gray-100">
                    <i class="fas fa-user-circle w-5 mr-2"></i> My Profile
                </a>
                ${user.isAdmin ? '<a href="admin.html" class="block px-4 py-2 text-sm text-yellow-600 font-bold hover:bg-gray-100">Admin Panel</a>' : ''}
            `;
            mobileLinks += `
                <a href="profile.html" class="flex items-center block py-2 px-6 text-sm text-blue-600 font-medium hover:bg-gray-100">
                    <i class="fas fa-user-circle w-5 mr-2"></i> My Profile
                </a>
                ${user.isAdmin ? '<a href="admin.html" class="block py-2 px-6 text-sm text-yellow-600 font-bold hover:bg-gray-100">Admin Panel</a>' : ''}
            `;
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
            checkAuth(); 
        }
    }
    desktopDropdown.innerHTML = desktopLinks;
    mobileNavLinks.innerHTML = mobileLinks;
}

// --- SHOP PAGE LOGIC ---

/**
 * Main initialization function for the shop page
 */
async function initializeShop() {
    try {
        // 1. Fetch all data in parallel
        const [categoryRes, productRes] = await Promise.all([
            fetch(`${API_URL}/api/categories`),
            fetch(`${API_URL}/api/products`)
        ]);

        if (!categoryRes.ok) throw new Error('Could not load categories');
        if (!productRes.ok) throw new Error('Could not load products');

        allCategories = await categoryRes.json();
        allProducts = await productRes.json();

        // 2. Create the category parent map
        categoryParentMap = new Map(allCategories.map(cat => [cat._id, cat.parentCategory]));

        // 3. Build the filter dropdowns
        populateChildFilter(); // Populate all sub-categories first

        // 4. Check URL for a filter
        const urlParams = new URLSearchParams(window.location.search);
        const parentCategory = urlParams.get('category');
        const childCategory = urlParams.get('subcategory');

        // Set initial filter state from URL
        if (parentCategory) {
            parentCategoryFilter.value = parentCategory;
            updateChildFilterDropdown(parentCategory); // Update child filter based on parent
        }
        if (childCategory) {
            childCategoryFilter.value = childCategory;
        }

        // 5. Add event listeners
        // --- FIXED: Only update dropdowns on change ---
        parentCategoryFilter.addEventListener('change', () => {
            updateChildFilterDropdown(parentCategoryFilter.value);
        });
        childCategoryFilter.addEventListener('change', () => {
            const selectedChild = childCategoryFilter.value;
            if (selectedChild !== 'all') {
                const parent = categoryParentMap.get(selectedChild);
                if (parent) {
                    parentCategoryFilter.value = parent;
                }
            }
        });
        
        // --- FIXED: Filter only on "Apply" button click ---
        applyFilterBtn.addEventListener('click', filterAndRenderProducts);

        // 6. Render products based on initial filters
        filterAndRenderProducts();

        // 7. Hide loader and show content
        pageLoader.style.display = 'none';
        productList.classList.remove('hidden');

    } catch (error) {
        console.error('Initialization error:', error);
        pageLoader.innerHTML = '<p class="col-span-3 text-red-500 text-center">Failed to load shop. Please try again later.</p>';
    }
}

/**
 * Populates the child category dropdown with <optgroup>
 */
function populateChildFilter() {
    childCategoryFilter.innerHTML = '<option value="all">All Sub-categories</option>';
    
    const parentCategories = ['Men', 'Women', 'Kids'];
    
    parentCategories.forEach(parent => {
        const childCats = allCategories.filter(cat => cat.parentCategory === parent);
        if (childCats.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = parent;
            childCats.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat._id;
                option.textContent = cat.name;
                optgroup.appendChild(option);
            });
            childCategoryFilter.appendChild(optgroup);
        }
    });
    childCategoryFilter.disabled = false; // Enable it by default
}

/**
 * Updates the child filter dropdown based on the selected parent
 */
function updateChildFilterDropdown(parentCategory) {
    childCategoryFilter.innerHTML = '<option value="all">All Sub-categories</option>';
    
    if (parentCategory === 'all') {
        populateChildFilter(); // Show all groups
        childCategoryFilter.disabled = false;
        return;
    }

    const childCats = allCategories.filter(cat => cat.parentCategory === parentCategory);
    if (childCats.length > 0) {
        childCats.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat._id;
            option.textContent = cat.name;
            childCategoryFilter.appendChild(option);
        });
        childCategoryFilter.disabled = false;
    } else {
        childCategoryFilter.disabled = true;
    }
}

/**
 * Filters and renders products based on current dropdown values
 */
function filterAndRenderProducts() {
    const selectedParent = parentCategoryFilter.value;
    const selectedChild = childCategoryFilter.value;

    let productsToShow = [];
    let title = 'All Products';

    if (selectedChild !== 'all') {
        // Child filter takes priority
        productsToShow = allProducts.filter(p => p.category?._id === selectedChild);
        const childCat = allCategories.find(c => c._id === selectedChild);
        title = childCat ? childCat.name : 'Filtered Products';
    } else if (selectedParent !== 'all') {
        // Parent filter is active
        productsToShow = allProducts.filter(p => categoryParentMap.get(p.category?._id) === selectedParent);
        title = `All ${selectedParent}'s Products`;
    } else {
        // No filters
        productsToShow = allProducts;
        title = 'All Products';
    }

    pageTitle.textContent = title;
    renderProducts(productsToShow);
}

/**
 * Renders the product cards into the list
 */
function renderProducts(products) {
    productList.innerHTML = ''; // Clear list
    
    if (products.length === 0) {
        productList.classList.add('hidden');
        noProductsMessage.classList.remove('hidden');
        return;
    }

    productList.classList.remove('hidden');
    noProductsMessage.classList.add('hidden');

    products.forEach(product => {
        productList.appendChild(createProductCard(product));
    });
}

/**
 * Creates the HTML for a single product card (single column layout)
 */
function createProductCard(product) {
    const productCard = document.createElement('div');
    // Pinkish theme, full-width, flex-row layout
    productCard.className = 'bg-gradient-to-b from-white to-pink-50 rounded-lg overflow-hidden shadow-lg border border-pink-100 flex flex-col sm:flex-row transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 group';
    
    const imageUrl = product.images && product.images.length > 0 
        ? product.images[0] 
        : 'https://placehold.co/600x600/e2e8f0/64748b?text=No+Image';
    
    const description = product.description ? product.description : 'No description available.';

    // --- FIXED: Image layout ---
    // sm:w-64 sets a fixed width on desktop, flex-shrink-0 stops it from shrinking
    // h-64 keeps the image height consistent on all screen sizes
    productCard.innerHTML = `
        <a href="product.html?id=${product._id}" class="block w-full sm:w-64 flex-shrink-0 overflow-hidden">
            <img src="${imageUrl}" alt="${product.name}" class="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105">
        </a>
        <div class="p-6 flex flex-col flex-grow">
            <h3 class="text-2xl font-semibold mb-2 text-gray-800">${product.name}</h3>
            <p class="text-gray-600 text-sm mb-4 flex-grow">${description}</p>
            <div class="mt-auto flex justify-between items-center">
                <span class="text-2xl font-bold text-pink-600">₹${product.price.toFixed(2)}</span>
                <a href="product.html?id=${product._id}" class="bg-pink-600 text-white text-sm font-medium py-2 px-5 rounded-md hover:bg-pink-700 transition duration-300">
                    View Details
                </a>
            </div>
        </div>
    `;
    return productCard;
}

// --- PWA SERVICE WORKER (Must be here too) ---
document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered successfully:', reg))
            .catch(err => console.error('Service Worker registration failed:', err));
    }
    
    // Run the main app functions
    checkAuth();
    initializeShop();
});