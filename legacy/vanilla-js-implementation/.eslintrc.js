module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'indent': ['error', 2],
  },
  globals: {
    // Define global variables used in client-side code
    'toggleTheme': 'readonly',
    'loadTheme': 'readonly',
    'setDefaultDates': 'readonly',
    'updateGuestsDisplay': 'readonly',
    'changeCount': 'readonly',
    'toggleGuestsDropdown': 'readonly',
    'displayHotels': 'readonly',
    'setupPagination': 'readonly',
    'sortResults': 'readonly',
    'clearFilters': 'readonly',
    'updatePriceFilter': 'readonly',
    'filterByStars': 'readonly',
    'filterByAmenities': 'readonly',
    'setView': 'readonly',
    'allHotels': 'writable',
    'filteredHotels': 'writable',
    'currentPage': 'writable',
  },
};