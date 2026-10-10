// Manejo del menú móvil desplegable
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    });
}

// Objeto para almacenar la información de la cita
let bookingData = {
    service: '',
    price: 0,
    barber: 'Lewis Habano',
    date: '',
    time: '',
    clientName: '',
    clientPhone: ''
};

// Obtener el precio desde el elemento seleccionado
function getServicePrice(radioElement) {
    if (!radioElement) return 0;
    let price = parseFloat(radioElement.getAttribute('data-price'));
    
    if (isNaN(price) || price <= 0) {
        const label = radioElement.closest('label') || radioElement.parentElement;
        if (label) {
            const text = label.textContent || '';
            const match = text.match(/\$\s*(\d+(\.\d+)?)/) || text.match(/(\d+(\.\d+)?)/);
            if (match) price = parseFloat(match[1]) || 0;
        }
    }
    return price;
}

// Actualizar el indicador de los pasos
function updateStepIndicators(stepNumber) {
    for (let i = 1; i <= 4; i++) {
        const stepEl = document.getElementById(`step-${i}`);
        if (stepEl) {
            if (i === stepNumber) {
                stepEl.classList.remove('hidden');
            } else {
                stepEl.classList.add('hidden');
            }
        }
        
        const indicator = document.getElementById(`step-indicator-${i}`);
        if (indicator) {
            const span = indicator.querySelector('span');
            if (i <= stepNumber) {
                indicator.className = "flex items-center gap-2 text-gold font-bold";
                if (span) span.className = "w-8 h-8 rounded-full border border-gold flex items-center justify-center bg-gold/10 font-bold";
            } else {
                indicator.className = "flex items-center gap-2 text-gray-600";
                if (span) span.className = "w-8 h-8 rounded-full border border-gray-800 flex items-center justify-center font-bold";
            }
        }
    }
}

// Navegación entre pasos
function nextStep(stepNumber) {
    if (stepNumber === 2) {
        const selectedService = document.querySelector('input[name="service"]:checked');
        if (!selectedService) {
            alert('Por favor selecciona un servicio para continuar.');
            return;
        }
        bookingData.service = selectedService.value;
        bookingData.price = getServicePrice(selectedService);
    } else if (stepNumber === 3) {
        const selectedBarber = document.querySelector('input[name="barber"]:checked');
        if (selectedBarber) bookingData.barber = selectedBarber.value;
    } else if (stepNumber === 4) {
        const dateInput = document.getElementById('booking-date').value;
        const timeInput = document.getElementById('booking-time').value;
        
        if (!dateInput || !timeInput) {
            alert('Por favor selecciona la fecha y la hora.');
            return;
        }
        bookingData.date = dateInput;
        bookingData.time = timeInput;
        updateBookingSummary();
    }

    updateStepIndicators(stepNumber);
}

function prevStep(stepNumber) {
    updateStepIndicators(stepNumber);
}

// Seleccionar servicio rápido
function selectService(serviceName, price) {
    bookingData.service = serviceName;
    bookingData.price = parseFloat(price) || 0;
    
    const radios = document.querySelectorAll('input[name="service"]');
    radios.forEach(radio => {
        if (radio.value === serviceName) {
            radio.checked = true;
            bookingData.price = getServicePrice(radio);
        }
    });

    nextStep(2);
    const reservasSection = document.getElementById('reservas');
    if (reservasSection) reservasSection.scrollIntoView({ behavior: 'smooth' });
}

// Seleccionar barbero rápido
function selectBarber(barberName) {
    bookingData.barber = barberName;
    const serviceSelected = document.querySelector('input[name="service"]:checked');
    
    if (!serviceSelected) {
        nextStep(1);
    } else {
        bookingData.service = serviceSelected.value;
        bookingData.price = getServicePrice(serviceSelected);
        nextStep(3);
    }
    
    const reservasSection = document.getElementById('reservas');
    if (reservasSection) reservasSection.scrollIntoView({ behavior: 'smooth' });
}

// Actualizar resumen en tiempo real
function updateBookingSummary() {
    const sService = document.getElementById('summary-service');
    const sDatetime = document.getElementById('summary-datetime');
    const sPrice = document.getElementById('summary-price');

    const activeService = document.querySelector('input[name="service"]:checked');
    const dateVal = document.getElementById('booking-date').value;
    const timeVal = document.getElementById('booking-time').value;

    if (activeService) {
        bookingData.service = activeService.value;
        bookingData.price = getServicePrice(activeService);
    }
    if (dateVal) bookingData.date = dateVal;
    if (timeVal) bookingData.time = timeVal;

    if (sService) sService.textContent = bookingData.service || '-';
    if (sDatetime) sDatetime.textContent = (bookingData.date && bookingData.time) ? `${bookingData.date} - ${bookingData.time}` : '-';
    if (sPrice) sPrice.textContent = bookingData.price ? `$${bookingData.price.toFixed(2)}` : '-';
}

// Confirmar reserva e integrar con WhatsApp
function confirmBooking(event) {
    event.preventDefault();

    const nameInput = document.getElementById('client-name');
    const phoneInput = document.getElementById('client-phone');

    if (!nameInput || !phoneInput || !nameInput.value.trim() || !phoneInput.value.trim()) {
        alert('Por favor ingresa tu nombre y teléfono.');
        return;
    }

    bookingData.clientName = nameInput.value.trim();
    bookingData.clientPhone = phoneInput.value.trim();

    // Rellenar pantalla de éxito
    document.getElementById('suc-name').textContent = bookingData.clientName;
    document.getElementById('suc-service').textContent = bookingData.service;
    document.getElementById('suc-barber').textContent = bookingData.barber;
    document.getElementById('suc-datetime').textContent = `${bookingData.date} a las ${bookingData.time}`;
    document.getElementById('suc-price').textContent = `$${bookingData.price.toFixed(2)}`;

    // Construir mensaje de WhatsApp
    const whatsappMessage = `¡Hola Mendez Barber! 💈%0A%0AQuiero confirmar mi cita con los siguientes datos:%0A- *Cliente:* ${bookingData.clientName}%0A- *Teléfono:* ${bookingData.clientPhone}%0A- *Servicio:* ${bookingData.service}%0A- *Barbero:* ${bookingData.barber}%0A- *Fecha y Hora:* ${bookingData.date} a las ${bookingData.time}%0A- *Total:* $${bookingData.price.toFixed(2)}%0A%0A¡Quedo atento a su confirmación!`;
    
    const whatsappUrl = `https://wa.me/584128674324?text=${whatsappMessage}`;
    const whatsappBtn = document.getElementById('whatsapp-btn');
    if (whatsappBtn) whatsappBtn.setAttribute('href', whatsappUrl);

    document.getElementById('booking-form').classList.add('hidden');
    const successScreen = document.getElementById('success-screen');
    successScreen.classList.remove('hidden');
    successScreen.scrollIntoView({ behavior: 'smooth' });
}

// Reiniciar reserva
function resetBooking() {
    const bookingForm = document.getElementById('booking-form');
    bookingForm.reset();
    bookingForm.classList.remove('hidden');
    document.getElementById('success-screen').classList.add('hidden');
    
    bookingData = {
        service: '',
        price: 0,
        barber: 'Lewis Habano',
        date: '',
        time: '',
        clientName: '',
        clientPhone: ''
    };
    
    nextStep(1);
}