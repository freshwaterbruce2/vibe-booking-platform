// Initialize hotel details search

async function searchHotelRate() {
    document.getElementById("loader").style.display = "block";

    // Clear previous hotel elements
    const hotelsDiv = document.getElementById("hotels");
    hotelsDiv.innerHTML = "";

    console.log("Searching for hotels...");
    const checkin = document.getElementById("checkin").value;
    const checkout = document.getElementById("checkout").value;
    const adults = document.getElementById("adults").value;
    const hotelId = document.getElementById("hotelId").value;
    const environment = document.getElementById("environment").value;

    console.log("Checkin:", checkin, "Checkout:", checkout, "Adults", adults, "hotelId", hotelId);

    try {
        // Make a request to your backend server
        const response = await fetch(
            `http://localhost:3001/search-rates?checkin=${checkin}&checkout=${checkout}&adults=${adults}&hotelId=${hotelId}&environment=${environment}`
        );
        const data = await response.json();
        const hotelInfo = data.hotelInfo;
        const rateInfo = data.rateInfo;

        displayHotelDetails(hotelInfo);
        displayRates(rateInfo);

        document.getElementById("loader").style.display = "none";
    } catch (error) {
        console.error("Error fetching hotels:", error);
        document.getElementById("loader").style.display = "none"; // Hide the loader

        // Display error message
        const errorMessageDiv = document.getElementById("errorMessage");
        errorMessageDiv.style.display = "block"; // Make the error message visible
        errorMessageDiv.textContent = "No availability found"; // Set the error message text
    }
}

function displayHotelDetails(hotelInfo) {
    const hotelsDiv = document.getElementById("hotels");
    // Ensure to use hotelInfo for accessing hotel properties
    const mainImage = hotelInfo.hotelImages.find(image => image.defaultImage === true)?.url || hotelInfo.hotelImages?.[0]?.url || 'defaultImageUrl';
    // Determine the correct facilities array and take the first 10 items
    const facilitiesArray = hotelInfo.facilities || hotelInfo.hotelFacilities;
    const facilitiesList = facilitiesArray.slice(0, 10).map(facility =>
        typeof facility === 'object' ? facility.name : facility // Check if facility is an object or just a string
    ).join(', ');

    const hotelElement = document.createElement("div");
    hotelElement.innerHTML = `
      <div class='card-container'>
        <div class='card'>
          <div class='flex items-start'>
            <div class='card-image'>
              <img src='${mainImage}' alt='hotel'>
            </div>
            <div class='flex-between-end w-full'>
              <div>
                <h4 class='card-title'>${hotelInfo.name}</h4>
                <h3 class='card-id'>Hotel Address: ${hotelInfo.address}</h3>
                <p class='features'>
                  ${hotelInfo.hotelDescription}
                </p>
                <p class='facilities'>
                   Facilities: ${facilitiesList}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    hotelsDiv.appendChild(hotelElement);
}

function displayRates(rateInfo) {
    const container = document.getElementById('rates'); // Correcting the comment to match the ID used
    container.innerHTML = ''; // Clear previous content

    rateInfo.forEach(roomTypeRates => {
        roomTypeRates.forEach(rate => {
            const rateDiv = document.createElement('div');
            rateDiv.className = 'rate-card'; // Changed class for CSS styling

            const rateName = document.createElement('h4');
            rateName.textContent = `Rate Name: ${rate.rateName}`;
            rateDiv.appendChild(rateName);

            const board = document.createElement('p');
            board.textContent = `Board: ${rate.board}`;
            rateDiv.appendChild(board);

            const refundableTag = document.createElement('p');
            refundableTag.textContent = `Refundable: ${rate.refundableTag}`;
            rateDiv.appendChild(refundableTag);

            const originalRate = document.createElement('p');
            originalRate.textContent = `Public Rate: $${rate.originalRate}`;
            originalRate.style.textDecoration = "line-through";  // Apply strikethrough styling
            rateDiv.appendChild(originalRate);

            const retailRate = document.createElement('p');
            retailRate.textContent = `Promotional rate: $${rate.retailRate}`;
            rateDiv.appendChild(retailRate);

            const bookButton = document.createElement('button');
            bookButton.textContent = 'Book Now';
            bookButton.onclick = function () {
                proceedToBooking(rate.offerId);
            };
            rateDiv.appendChild(bookButton);

            container.appendChild(rateDiv);
        });
    });
}

// You would call this function with the rateInfo data when appropriate, for example after fetching the data.

async function proceedToBooking(rateId) {
    console.log("Proceeding to booking for hotel ID:", rateId);

    // Clear existing HTML and display the loader
    const hotelsDiv = document.getElementById("hotels");
    const ratesDiv = document.getElementById("rates");
    const loader = document.getElementById("loader");
    hotelsDiv.innerHTML = "";
    ratesDiv.innerHTML = "";
    loader.style.display = "block";

    // Create and append the form dynamically
    const formHtml = `
        <form id="bookingForm" class="booking-form">
            <input type="hidden" name="prebookId" value="${rateId}">
            <div class="form-group">
                <label for="guestFirstName">Guest First Name:</label>
                <input type="text" id="guestFirstName" name="guestFirstName" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="guestLastName">Guest Last Name:</label>
                <input type="text" id="guestLastName" name="guestLastName" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="guestEmail">Guest Email:</label>
                <input type="email" id="guestEmail" name="guestEmail" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="holderName">Credit Card Holder Name:</label>
                <input type="text" id="holderName" name="holderName" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="voucher">Voucher Code:</label>
                <input type="text" id="voucher" name="voucher" class="form-input">
            </div>
            <button type="submit" class="book-btn">Book Now</button>
        </form>
    `;
    hotelsDiv.innerHTML = formHtml; // Insert the form into the 'hotels' div
    loader.style.display = "none";

    // Add event listener to handle form submission
    document.getElementById("bookingForm").addEventListener("submit", async function (event) {
        event.preventDefault();
        loader.style.display = "block";

        const formData = new FormData(event.target);
        const guestFirstName = formData.get('guestFirstName');
        const guestLastName = formData.get('guestLastName');
        const guestEmail = formData.get('guestEmail');
        const holderName = formData.get('holderName');
        const voucher = formData.get('voucher');
        const environment = document.getElementById("environment").value;

        try {
            // Include additional guest details in the payment processing request

            const bodyData = {
                environment,
                rateId
            };

            // Add voucher if it exists
            if (voucher) {
                bodyData.voucherCode = voucher;
            }

            const prebookResponse = await fetch(`http://localhost:3001/prebook`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(bodyData),
            });

            const prebookData = await prebookResponse.json();
            console.log("preboook successful!", prebookData.success.data);
            const paymentData = {
				price: prebookData.success.data.price, // Ensure this field exists
				voucherTotalAmount: prebookData.success.data.voucherTotalAmount // Ensure this field exists or use a default if optional
			};
			displayPaymentInfo(paymentData);

            initializePaymentForm(
                prebookData.success.data.secretKey,
                prebookData.success.data.prebookId,
                prebookData.success.data.transactionId,
                guestFirstName, // Corrected
                guestLastName,  // Corrected
                guestEmail,     // Corrected
                '#pe', // targetElementSelector
                environment // environmentValue
            );
        } catch (error) {
            console.error("Error in payment processing or booking:", error);
        } finally {
            loader.style.display = "none";
        }
    });
}

function displayPaymentInfo(data) {
	console.log("displaty payment data function called)")
	const paymentDiv = document.getElementById('hotels');
	if (!paymentDiv) {
		console.error('paymentInfo div not found');
		return;
	}
	// Destructure the necessary data from the object
	const { price, currency, voucherTotalAmount } = data;

	// Create content for the div
	let content = `<p>Total Amount: ${Math.round(price)} USD</p>`;

	// Check if voucherTotalAmount is available and add it to the content
	if (voucherTotalAmount && voucherTotalAmount > 0) {
		content += `<p>Voucher Total Amount: ${Math.round(voucherTotalAmount)} USD</p>`;
	}

	// Update the div's content
	paymentDiv.innerHTML = content;
}

// New UI functions for booking/payment outcomes on details page

function resetBookingProcessDetailsPage() {
    const hotelsDiv = document.getElementById("hotels");
    const ratesDiv = document.getElementById("rates");
    const paymentFormDiv = document.getElementById("payment-form"); // Though #pe is primary for payment widget
    const peDiv = document.getElementById("pe"); // Payment widget and confirmation/error messages appear here
    const errorMessageDiv = document.getElementById("errorMessage");

    // Clear content from these divs
    if (hotelsDiv) hotelsDiv.innerHTML = ''; // Clears hotel details, initial booking form
    if (ratesDiv) ratesDiv.innerHTML = ''; // Clears rate cards
    if (paymentFormDiv) paymentFormDiv.innerHTML = ''; 
    if (peDiv) peDiv.innerHTML = ''; // Clears payment widget and subsequent messages
    if (errorMessageDiv) {
        errorMessageDiv.innerHTML = '';
        errorMessageDiv.style.display = 'none'; // Hide it
    }
    
    // After clearing, the user can use the existing search bar at the top of details.html
    // to search for rates for the same or a different hotel.
    console.log("Booking/payment UI cleared on details page. User can initiate a new search.");
}

function displayBookingConfirmation(bookingData, targetElementSelector) {
    const targetDiv = document.querySelector(targetElementSelector);
    if (!targetDiv) {
        console.error('Target element for booking confirmation not found on details page:', targetElementSelector);
        alert(`Booking Confirmed! ID: ${bookingData?.bookingId || 'N/A'}. Check console for details.`);
        console.log("Booking Confirmation Data (details page):", bookingData);
        return;
    }

    const hotelName = bookingData.hotel?.name || 'N/A';
    const bookingId = bookingData.bookingId || 'N/A';
    const status = bookingData.status || 'N/A';
    const checkin = bookingData.checkin ? new Date(bookingData.checkin).toLocaleDateString() : 'N/A';
    const checkout = bookingData.checkout ? new Date(bookingData.checkout).toLocaleDateString() : 'N/A';
    
    const room = bookingData.bookedRooms?.[0];
    const roomTypeName = room?.roomType?.name || 'N/A';
    const guestName = `${room?.firstName || ''} ${room?.lastName || ''}`.trim() || 'N/A';
    const totalAmount = room?.rate?.retailRate?.total?.amount || 'N/A';
    const currency = room?.rate?.retailRate?.total?.currency || '';

    let confirmationHtml = `
        <div class="booking-confirmation-details" style="padding: 20px; border: 1px solid #ccc; border-radius: 5px; background-color: #f9f9f9;">
            <h3 style="color: #28a745; border-bottom: 1px solid #eee; padding-bottom: 10px;">Booking Confirmed!</h3>
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Hotel:</strong> ${hotelName}</p>
            <p><strong>Status:</strong> <span style="text-transform: capitalize;">${status.toLowerCase()}</span></p>
            <p><strong>Check-in:</strong> ${checkin}</p>
            <p><strong>Check-out:</strong> ${checkout}</p>
            <hr style="margin: 15px 0;">
            <h4>Room & Guest Details:</h4>
            <p><strong>Room Type:</strong> ${roomTypeName}</p>
            <p><strong>Guest Name:</strong> ${guestName}</p>
            <p><strong>Total Amount:</strong> ${totalAmount} ${currency}</p>
            <hr style="margin: 15px 0;">
            <button onclick="resetBookingProcessDetailsPage()" class="btn book-btn" style="margin-top: 10px;">Search Again</button>
        </div>
    `;
    targetDiv.innerHTML = confirmationHtml;
}

function displayBookingError(errorMessage, errorDetails, targetElementSelector) {
    const targetDiv = document.querySelector(targetElementSelector);
    if (!targetDiv) {
        console.error('Target element for booking error not found on details page:', targetElementSelector);
        alert(`Booking Failed: ${errorMessage}. Check console for details.`);
        console.error("Booking Error Details (details page):", errorDetails);
        return;
    }
    let detailsHtml = '';
    if (errorDetails) {
        const detailsString = typeof errorDetails === 'object' ? JSON.stringify(errorDetails, null, 2) : String(errorDetails);
        detailsHtml = `<pre style="font-size: 0.8em; color: #555; background-color: #f0f0f0; padding: 5px; border-radius: 3px; max-height: 100px; overflow-y: auto;">Details: ${detailsString}</pre>`;
    }
    targetDiv.innerHTML = `
        <div class="booking-error-details" style="padding: 20px; border: 1px solid #dc3545; border-radius: 5px; background-color: #f8d7da;">
            <h3 style="color: #dc3545; border-bottom: 1px solid #f5c6cb; padding-bottom: 10px;">Booking Failed</h3>
            <p><strong>Error:</strong> ${errorMessage}</p>
            ${detailsHtml}
            <button onclick="resetBookingProcessDetailsPage()" class="btn cancel-btn" style="margin-top: 10px;">Try Again</button>
        </div>
    `;
}

function displayPaymentError(errorMessage, targetElementSelector) {
    const targetDiv = document.querySelector(targetElementSelector);
    if (!targetDiv) {
        console.error('Target element for payment error not found on details page:', targetElementSelector);
        alert(`Payment Failed: ${errorMessage}.`);
        return;
    }
    targetDiv.innerHTML = `
        <div class="payment-error-details" style="padding: 20px; border: 1px solid #ffc107; border-radius: 5px; background-color: #fff3cd;">
            <h3 style="color: #856404; border-bottom: 1px solid #ffeeba; padding-bottom: 10px;">Payment Issue</h3>
            <p>${errorMessage}</p>
            <button onclick="resetBookingProcessDetailsPage()" class="btn cancel-btn" style="margin-top: 10px;">Try Again</button>
        </div>
    `;
}