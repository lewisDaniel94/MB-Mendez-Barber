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

// Funciones para controlar el Modal Personalizado
function showCustomModal(title, message) {
    const modal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');

    if (modalTitle) modalTitle.textContent = title;
    if (modalMessage) modalMessage.textContent = message;
    if (modal) modal.classList.remove('hidden');
}

function closeCustomModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) modal.classList.add('hidden');
}

// Objeto para almacenar la información de la cita
let bookingData = {
    services: [], 
    price: 0,
    barber: '',
    date: '',
    time: '',
    clientName: '',
    clientPhone: ''
};

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

// Calcular servicios y precios seleccionados en tiempo real
function updateBookingSummary() {
    const checkedServices = document.querySelectorAll('input[name="service"]:checked');
    bookingData.services = [];
    let totalPrice = 0;

    checkedServices.forEach(checkbox => {
        bookingData.services.push(checkbox.value);
        let price = parseFloat(checkbox.getAttribute('data-price')) || 0;
        totalPrice += price;
    });

    bookingData.price = totalPrice;

    const step1Total = document.getElementById('step1-total-price');
    if (step1Total) {
        step1Total.textContent = `$${totalPrice.toFixed(2)}`;
    }

    const activeBarber = document.querySelector('input[name="barber"]:checked');
    if (activeBarber) {
        bookingData.barber = activeBarber.value;
    }

    const dateVal = document.getElementById('booking-date').value;
    const timeVal = document.getElementById('booking-time').value;
    if (dateVal) bookingData.date = dateVal;
    if (timeVal) bookingData.time = timeVal;

    const sServices = document.getElementById('summary-services');
    const sBarber = document.getElementById('summary-barber');
    const sDatetime = document.getElementById('summary-datetime');
    const sPrice = document.getElementById('summary-price');

    if (sServices) {
        sServices.textContent = bookingData.services.length > 0 ? bookingData.services.join(', ') : 'Ningún servicio seleccionado';
    }
    if (sBarber) {
        sBarber.textContent = bookingData.barber || 'No seleccionado';
    }
    if (sDatetime) {
        sDatetime.textContent = (bookingData.date && bookingData.time) ? `${bookingData.date} a las ${bookingData.time}` : '-';
    }
    if (sPrice) {
        sPrice.textContent = `$${bookingData.price.toFixed(2)}`;
    }
}

// Navegación entre pasos con verificación previa en el Paso 3
async function nextStep(stepNumber) {
    if (stepNumber === 2) {
        const checkedServices = document.querySelectorAll('input[name="service"]:checked');
        if (checkedServices.length === 0) {
            showCustomModal('Selección Requerida', 'Por favor selecciona al menos un servicio para continuar con tu reserva.');
            return;
        }
        updateBookingSummary();
    } else if (stepNumber === 3) {
        const selectedBarber = document.querySelector('input[name="barber"]:checked');
        if (!selectedBarber) {
            showCustomModal('Barbero Requerido', 'Por favor selecciona tu barbero preferido para poder avanzar.');
            return;
        }
        bookingData.barber = selectedBarber.value;
    } else if (stepNumber === 4) {
        // Validar fecha y hora seleccionada
        const dateInput = document.getElementById('booking-date').value;
        const timeInput = document.getElementById('booking-time').value;
        
        if (!dateInput || !timeInput) {
            showCustomModal('Fecha y Hora Requeridas', 'Por favor selecciona la fecha y el horario deseado para tu cita.');
            return;
        }
        bookingData.date = dateInput;
        bookingData.time = timeInput;

        // VERIFICAR DISPONIBILIDAD EN FIREBASE ANTES DE ENTRAR AL PASO 4
        try {
            const db = window.db;
            if (!db) {
                throw new Error("Base de datos no inicializada.");
            }

            const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js");

            const q = query(
                collection(db, "citas"),
                where("barber", "==", bookingData.barber),
                where("date", "==", bookingData.date),
                where("time", "==", bookingData.time)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                showCustomModal(
                    'Horario No Disponible', 
                    `Lo sentimos, el barbero ${bookingData.barber} ya tiene una cita reservada para el ${bookingData.date} a las ${bookingData.time}. Por favor, selecciona otro horario u otro barbero.`
                );
                return; // Detiene el avance al paso 4
            }
        } catch (error) {
            console.error("Error al verificar disponibilidad: ", error);
            showCustomModal('Error de Conexión', 'Ocurrió un inconveniente al comprobar el horario. Inténtalo de nuevo.');
            return;
        }

        updateBookingSummary();
    }

    updateStepIndicators(stepNumber);
}

function prevStep(stepNumber) {
    updateStepIndicators(stepNumber);
}

// Seleccionar servicio rápido desde la carta general
function selectService(serviceName, price) {
    const checkboxes = document.querySelectorAll('input[name="service"]');
    checkboxes.forEach(cb => {
        if (cb.value === serviceName) {
            cb.checked = true;
        }
    });

    updateBookingSummary();
    nextStep(2);
    
    const reservasSection = document.getElementById('reservas');
    if (reservasSection) reservasSection.scrollIntoView({ behavior: 'smooth' });
}

// Seleccionar barbero rápido desde la sección de equipo
function selectBarber(barberName) {
    const barberRadios = document.querySelectorAll('input[name="barber"]');
    barberRadios.forEach(radio => {
        if (radio.value === barberName) {
            radio.checked = true;
            bookingData.barber = barberName;
        }
    });

    const checkedServices = document.querySelectorAll('input[name="service"]:checked');
    if (checkedServices.length === 0) {
        nextStep(1);
    } else {
        updateBookingSummary();
        nextStep(3);
    }
    
    const reservasSection = document.getElementById('reservas');
    if (reservasSection) reservasSection.scrollIntoView({ behavior: 'smooth' });
}

// Confirmar reserva final y guardar en Firestore
async function confirmBooking(event) {
    event.preventDefault();

    const nameInput = document.getElementById('client-name');
    const phoneInput = document.getElementById('client-phone');

    if (!nameInput || !phoneInput || !nameInput.value.trim() || !phoneInput.value.trim()) {
        showCustomModal('Datos Incompletos', 'Por favor ingresa tu nombre completo y teléfono de contacto.');
        return;
    }

    bookingData.clientName = nameInput.value.trim();
    bookingData.clientPhone = phoneInput.value.trim();

    const submitBtn = document.getElementById('submit-booking-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = "Guardando reserva...";

    try {
        const db = window.db;
        const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js");

        // Guardar la cita directamente (ya fue verificada en el paso anterior)
        await addDoc(collection(db, "citas"), {
            barber: bookingData.barber,
            date: bookingData.date,
            time: bookingData.time,
            clientName: bookingData.clientName,
            clientPhone: bookingData.clientPhone,
            services: bookingData.services,
            totalPrice: bookingData.price,
            createdAt: new Date().toISOString()
        });

        // Rellenar pantalla de éxito
        document.getElementById('suc-name').textContent = bookingData.clientName;
        document.getElementById('suc-services').textContent = bookingData.services.join(', ');
        document.getElementById('suc-barber').textContent = bookingData.barber;
        document.getElementById('suc-datetime').textContent = `${bookingData.date} a las ${bookingData.time}`;
        document.getElementById('suc-price').textContent = `$${bookingData.price.toFixed(2)}`;

        // Construir mensaje detallado para WhatsApp
        const servicesListStr = bookingData.services.join(', ');
        const whatsappMessage = `¡Hola Mendez Barber! 💈%0A%0AQuiero confirmar mi cita con los siguientes datos:%0A- *Cliente:* ${bookingData.clientName}%0A- *Teléfono:* ${bookingData.clientPhone}%0A- *Servicios:* ${servicesListStr}%0A- *Barbero:* ${bookingData.barber}%0A- *Fecha y Hora:* ${bookingData.date} a las ${bookingData.time}%0A- *Monto Total:* $${bookingData.price.toFixed(2)}%0A%0A¡Quedo atento a su confirmación!`;
        
        const whatsappUrl = `https://wa.me/584128674324?text=${whatsappMessage}`;
        const whatsappBtn = document.getElementById('whatsapp-btn');
        if (whatsappBtn) whatsappBtn.setAttribute('href', whatsappUrl);

        document.getElementById('booking-form').classList.add('hidden');
        const successScreen = document.getElementById('success-screen');
        successScreen.classList.remove('hidden');
        successScreen.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error("Error al guardar la cita en Firebase: ", error);
        showCustomModal('Error de Conexión', 'Ocurrió un inconveniente al registrar la cita. Por favor intenta de nuevo.');
        submitBtn.disabled = false;
        submitBtn.textContent = "Confirmar y Reservar Cita";
    }
}

// Reiniciar formulario de reserva
function resetBooking() {
    const bookingForm = document.getElementById('booking-form');
    bookingForm.reset();
    bookingForm.classList.remove('hidden');
    document.getElementById('success-screen').classList.add('hidden');
    
    bookingData = {
        services: [],
        price: 0,
        barber: '',
        date: '',
        time: '',
        clientName: '',
        clientPhone: ''
    };
    
    updateBookingSummary();
    nextStep(1);
}