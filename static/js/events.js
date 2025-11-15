/**
 * EVENTS DATA STRUCTURE
 * 
 * To add a new event, simply add a new object to the eventsData array below.
 * 
 * Required fields:
 * - id: Unique identifier (string)
 * - title: Event title in Hindi
 * - titleEn: Event title in English
 * - date: Event date in YYYY-MM-DD format (e.g., '2024-12-28')
 * - time: Event time in HH:MM format (24-hour, e.g., '19:00')
 * - location: Event location in Hindi
 * - locationEn: Event location in English
 * - description: Event description in Hindi
 * - descriptionEn: Event description in English
 * - image: Path to event image (optional)
 * 
 * Example:
 * {
 *     id: '7',
 *     title: 'नया कार्यक्रम',
 *     titleEn: 'New Event',
 *     date: '2025-02-15',
 *     time: '16:00',
 *     location: 'संस्थान परिसर',
 *     locationEn: 'Institute Campus',
 *     description: 'कार्यक्रम का विवरण',
 *     descriptionEn: 'Event description',
 *     image: '/static/images/1.jpeg'
 * }
 */
// Make eventsData available globally IMMEDIATELY
var eventsData = window.eventsData || [];
    {
        id: '1',
        title: 'भजन संध्या - श्री रामद्वारा',
        titleEn: 'Bhajan Sandhya - Shri Ramdwara',
        date: '2025-12-28',
        time: '19:00',
        location: 'श्री रामद्वारा, चित्तौड़गढ़',
        locationEn: 'Shri Ramdwara, Chittorgarh',
        description: 'एक विशेष भजन संध्या का आयोजन जिसमें सभी श्रद्धालु भाग ले सकते हैं।',
        descriptionEn: 'A special Bhajan Sandhya event where all devotees can participate.',
        image: '/static/images/1.jpeg'
    },
    {
        id: '2',
        title: 'निशुल्क चिकित्सा शिविर',
        titleEn: 'Free Medical Camp',
        date: '2025-01-05',
        time: '09:00',
        location: 'ग्रामीण क्षेत्र, चित्तौड़गढ़',
        locationEn: 'Rural Area, Chittorgarh',
        description: 'ग्रामीण क्षेत्रों में निशुल्क चिकित्सा शिविर का आयोजन।',
        descriptionEn: 'Free medical camp organized in rural areas.',
        image: '/static/images/2.jpeg'
    },
    {
        id: '3',
        title: 'विशेष धार्मिक सभा',
        titleEn: 'Special Religious Gathering',
        date: '2025-01-15',
        time: '18:00',
        location: 'संत भगत राम धार्मिक सेवा संस्थान',
        locationEn: 'Sant Bhagat Ram Religious Service Institute',
        description: 'संत भगत राम जी के मार्गदर्शन में विशेष धार्मिक सभा।',
        descriptionEn: 'Special religious gathering under the guidance of Sant Bhagat Ram Ji.',
        image: '/static/images/4.jpg'
    },
    {
        id: '4',
        title: 'युवा कौशल विकास कार्यक्रम',
        titleEn: 'Youth Skill Development Program',
        date: '2025-01-20',
        time: '10:00',
        location: 'संस्थान परिसर',
        locationEn: 'Institute Campus',
        description: 'युवाओं के लिए कौशल विकास कार्यक्रम का शुभारंभ।',
        descriptionEn: 'Launch of skill development program for youth.',
        image: '/static/images/5.jpg'
    },
    {
        id: '5',
        title: 'भोजन वितरण कार्यक्रम',
        titleEn: 'Food Distribution Program',
        date: '2025-01-25',
        time: '11:00',
        location: 'गरीब बस्ती, चित्तौड़गढ़',
        locationEn: 'Poor Settlement, Chittorgarh',
        description: 'गरीब परिवारों को पौष्टिक भोजन वितरण।',
        descriptionEn: 'Distribution of nutritious food to poor families.',
        image: '/static/images/6.jpg'
    },
    {
        id: '6',
        title: 'शैक्षिक कार्यक्रम',
        titleEn: 'Educational Program',
        date: '2025-02-01',
        time: '14:00',
        location: 'संस्थान परिसर',
        locationEn: 'Institute Campus',
        description: 'बच्चों के लिए शैक्षिक कार्यक्रम का आयोजन।',
        descriptionEn: 'Educational program organized for children.',
        image: '/static/images/7.jpg'
    },
    {
        id: '7',
        title: 'विशेष प्रवचन सत्र',
        titleEn: 'Special Discourse Session',
        date: '2025-02-10',
        time: '17:00',
        location: 'श्री रामद्वारा, चित्तौड़गढ़',
        locationEn: 'Shri Ramdwara, Chittorgarh',
        description: 'संत भगत राम जी द्वारा विशेष प्रवचन सत्र का आयोजन।',
        descriptionEn: 'Special discourse session by Sant Bhagat Ram Ji.',
        image: '/static/images/1.jpeg'
    },
    {
        id: '8',
        title: 'रक्तदान शिविर',
        titleEn: 'Blood Donation Camp',
        date: '2025-02-15',
        time: '10:00',
        location: 'संस्थान परिसर',
        locationEn: 'Institute Campus',
        description: 'समाज सेवा के लिए रक्तदान शिविर का आयोजन।',
        descriptionEn: 'Blood donation camp organized for social service.',
        image: '/static/images/2.jpeg'
    },
    {
        id: '9',
        title: 'वृक्षारोपण अभियान',
        titleEn: 'Tree Plantation Drive',
        date: '2025-02-20',
        time: '08:00',
        location: 'ग्रामीण क्षेत्र, चित्तौड़गढ़',
        locationEn: 'Rural Area, Chittorgarh',
        description: 'पर्यावरण संरक्षण के लिए वृक्षारोपण अभियान।',
        descriptionEn: 'Tree plantation drive for environmental conservation.',
        image: '/static/images/4.jpg'
    },
    {
        id: '10',
        title: 'महिला सशक्तिकरण कार्यक्रम',
        titleEn: 'Women Empowerment Program',
        date: '2025-02-25',
        time: '11:00',
        location: 'संस्थान परिसर',
        locationEn: 'Institute Campus',
        description: 'महिलाओं के सशक्तिकरण के लिए विशेष कार्यक्रम।',
        descriptionEn: 'Special program for women empowerment.',
        image: '/static/images/5.jpg'
    },
    {
        id: '11',
        title: 'विशेष भजन संध्या',
        titleEn: 'Special Bhajan Sandhya',
        date: '2025-03-05',
        time: '19:30',
        location: 'श्री रामद्वारा, चित्तौड़गढ़',
        locationEn: 'Shri Ramdwara, Chittorgarh',
        description: 'विशेष अवसर पर भजन संध्या का आयोजन।',
        descriptionEn: 'Bhajan Sandhya organized on special occasion.',
        image: '/static/images/6.jpg'
    },
    {
        id: '12',
        title: 'बुजुर्गों के लिए स्वास्थ्य जांच',
        titleEn: 'Health Checkup for Elderly',
        date: '2025-03-10',
        time: '09:00',
        location: 'ग्रामीण क्षेत्र, चित्तौड़गढ़',
        locationEn: 'Rural Area, Chittorgarh',
        description: 'बुजुर्गों के लिए निशुल्क स्वास्थ्य जांच कैंप।',
        descriptionEn: 'Free health checkup camp for elderly.',
        image: '/static/images/7.jpg'
    },
    {
        id: '13',
        title: 'योग प्रशिक्षण कार्यक्रम',
        titleEn: 'Yoga Training Program',
        date: '2025-03-15',
        time: '06:00',
        location: 'संस्थान परिसर',
        locationEn: 'Institute Campus',
        description: 'स्वास्थ्य और कल्याण के लिए योग प्रशिक्षण।',
        descriptionEn: 'Yoga training for health and wellness.',
        image: '/static/images/1.jpeg'
    },
    {
        id: '14',
        title: 'विशेष धार्मिक यात्रा',
        titleEn: 'Special Religious Pilgrimage',
        date: '2025-03-20',
        time: '07:00',
        location: 'चित्तौड़गढ़ से शुरू',
        locationEn: 'Starting from Chittorgarh',
        description: 'विशेष धार्मिक स्थलों की यात्रा का आयोजन।',
        descriptionEn: 'Organized pilgrimage to special religious sites.',
        image: '/static/images/2.jpeg'
    },
    {
        id: '15',
        title: 'बच्चों के लिए खेल प्रतियोगिता',
        titleEn: 'Sports Competition for Children',
        date: '2025-03-25',
        time: '15:00',
        location: 'संस्थान परिसर',
        locationEn: 'Institute Campus',
        description: 'बच्चों के लिए खेल प्रतियोगिता का आयोजन।',
        descriptionEn: 'Sports competition organized for children.',
        image: '/static/images/4.jpg'
    },
    {
        id: '16',
        title: 'विशेष सत्संग कार्यक्रम',
        titleEn: 'Special Satsang Program',
        date: '2025-04-02',
        time: '18:30',
        location: 'श्री रामद्वारा, चित्तौड़गढ़',
        locationEn: 'Shri Ramdwara, Chittorgarh',
        description: 'आध्यात्मिक ज्ञान और सत्संग का विशेष कार्यक्रम।',
        descriptionEn: 'Special program for spiritual knowledge and satsang.',
        image: '/static/images/5.jpg'
    },
    {
        id: '17',
        title: 'कंप्यूटर प्रशिक्षण कार्यक्रम',
        titleEn: 'Computer Training Program',
        date: '2025-04-08',
        time: '10:00',
        location: 'संस्थान परिसर',
        locationEn: 'Institute Campus',
        description: 'युवाओं के लिए कंप्यूटर प्रशिक्षण कार्यक्रम।',
        descriptionEn: 'Computer training program for youth.',
        image: '/static/images/6.jpg'
    },
    {
        id: '18',
        title: 'विशेष प्रार्थना सभा',
        titleEn: 'Special Prayer Gathering',
        date: '2025-04-12',
        time: '19:00',
        location: 'संत भगत राम धार्मिक सेवा संस्थान',
        locationEn: 'Sant Bhagat Ram Religious Service Institute',
        description: 'विशेष प्रार्थना सभा का आयोजन।',
        descriptionEn: 'Special prayer gathering organized.',
        image: '/static/images/7.jpg'
    },
    {
        id: '19',
        title: 'कपड़ा वितरण कार्यक्रम',
        titleEn: 'Clothing Distribution Program',
        date: '2025-04-18',
        time: '11:00',
        location: 'गरीब बस्ती, चित्तौड़गढ़',
        locationEn: 'Poor Settlement, Chittorgarh',
        description: 'गरीब परिवारों को कपड़े वितरण।',
        descriptionEn: 'Distribution of clothes to poor families.',
        image: '/static/images/1.jpeg'
    },
    {
        id: '20',
        title: 'विशेष धार्मिक उत्सव',
        titleEn: 'Special Religious Festival',
        date: '2025-04-22',
        time: '17:00',
        location: 'श्री रामद्वारा, चित्तौड़गढ़',
        locationEn: 'Shri Ramdwara, Chittorgarh',
        description: 'विशेष धार्मिक उत्सव का आयोजन।',
        descriptionEn: 'Special religious festival organized.',
        image: '/static/images/2.jpeg'
    },
    {
        id: '21',
        title: 'स्वच्छता अभियान',
        titleEn: 'Cleanliness Drive',
        date: '2025-04-28',
        time: '08:00',
        location: 'ग्रामीण क्षेत्र, चित्तौड़गढ़',
        locationEn: 'Rural Area, Chittorgarh',
        description: 'समुदाय स्वच्छता अभियान का आयोजन।',
        descriptionEn: 'Community cleanliness drive organized.',
        image: '/static/images/4.jpg'
    },
    {
        id: '22',
        title: 'विशेष भोजन सेवा',
        titleEn: 'Special Food Service',
        date: '2025-05-05',
        time: '12:00',
        location: 'संस्थान परिसर',
        locationEn: 'Institute Campus',
        description: 'विशेष अवसर पर भोजन सेवा का आयोजन।',
        descriptionEn: 'Food service organized on special occasion.',
        image: '/static/images/5.jpg'
    },
    {
        id: '23',
        title: 'संगीत कार्यक्रम',
        titleEn: 'Music Program',
        date: '2025-05-10',
        time: '19:00',
        location: 'श्री रामद्वारा, चित्तौड़गढ़',
        locationEn: 'Shri Ramdwara, Chittorgarh',
        description: 'भक्ति संगीत कार्यक्रम का आयोजन।',
        descriptionEn: 'Devotional music program organized.',
        image: '/static/images/6.jpg'
    },
    {
        id: '24',
        title: 'विशेष प्रवचन और कथा',
        titleEn: 'Special Discourse and Katha',
        date: '2025-05-15',
        time: '18:00',
        location: 'संत भगत राम धार्मिक सेवा संस्थान',
        locationEn: 'Sant Bhagat Ram Religious Service Institute',
        description: 'विशेष प्रवचन और कथा का आयोजन।',
        descriptionEn: 'Special discourse and katha organized.',
        image: '/static/images/7.jpg'
    }
];

// Get current language - use the one from language.js if available
function getCurrentLanguage() {
    if (window.getCurrentLanguage && typeof window.getCurrentLanguage === 'function') {
        return window.getCurrentLanguage();
    }
    // Fallback to localStorage directly
    return localStorage.getItem('selectedLanguage') || 'hi';
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const lang = getCurrentLanguage();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: lang === 'en' ? 'long' : undefined
    };
    return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'hi-IN', options);
}

// Format time for display
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Generate Google Calendar URL
function generateGoogleCalendarUrl(event) {
    const startDate = new Date(`${event.date}T${event.time}`);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    const lang = getCurrentLanguage();
    
    const title = lang === 'en' ? event.titleEn : event.title;
    const description = lang === 'en' ? event.descriptionEn : event.description;
    const location = lang === 'en' ? event.locationEn : event.location;
    
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        details: description,
        location: location
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Generate Outlook Calendar URL
function generateOutlookCalendarUrl(event) {
    const startDate = new Date(`${event.date}T${event.time}`);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const lang = getCurrentLanguage();
    
    const title = lang === 'en' ? event.titleEn : event.title;
    const description = lang === 'en' ? event.descriptionEn : event.description;
    const location = lang === 'en' ? event.locationEn : event.location;
    
    const params = new URLSearchParams({
        subject: title,
        startdt: startDate.toISOString(),
        enddt: endDate.toISOString(),
        body: description,
        location: location
    });
    
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

// Render Events
function renderEvents() {
    if (window.skipJsEventRender) {
        console.log('Skipping JS event render because server rendered events.');
        return false;
    }
    console.log('=== renderEvents called ===');
    const grid = document.getElementById('eventsGrid');
    if (!grid) {
        console.error('Events grid not found!');
        return false;
    }
    console.log('Grid found:', grid);
    
    // Check if eventsData exists (try both local and window scope)
    let dataToUse = eventsData || window.eventsData;
    if (!dataToUse || !Array.isArray(dataToUse)) {
        console.error('eventsData is not available or not an array!');
        console.error('Local eventsData:', typeof eventsData);
        console.error('window.eventsData:', typeof window.eventsData);
        grid.innerHTML = '<div class="no-events"><p>Error: Events data not loaded.</p></div>';
        return false;
    }
    
    console.log('Events data available:', dataToUse.length, 'events');
    
    const lang = getCurrentLanguage();
    console.log('Current language:', lang);
    
    // TEMPORARILY SHOW ALL EVENTS FOR TESTING - Remove date filtering
    console.log('TEMPORARY: Showing ALL events regardless of date for testing');
    let upcomingEvents = dataToUse.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Original date filtering code (commented out for testing)
    /*
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter upcoming events
    let upcomingEvents = eventsData
        .filter(event => {
            try {
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate >= today;
            } catch (e) {
                console.error('Error parsing date for event:', event.id, e);
                return true; // Include event if date parsing fails
            }
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // If no upcoming events, show all events
    if (upcomingEvents.length === 0) {
        console.log('No upcoming events, showing all events');
        upcomingEvents = eventsData.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    */
    
    // Debug logging
    console.log('Events Page Debug:');
    console.log('- Total events in data:', dataToUse.length);
    console.log('- Upcoming events found:', upcomingEvents.length);
    console.log('- First event:', upcomingEvents[0]);
    
    if (upcomingEvents.length === 0) {
        grid.innerHTML = `
            <div class="no-events">
                <p data-lang-events="noUpcomingEvents">No upcoming events scheduled.</p>
            </div>
        `;
        return false;
    }
    
    console.log('Rendering', upcomingEvents.length, 'events...');
    
    try {
        const html = upcomingEvents.map(event => {
        const title = lang === 'en' ? event.titleEn : event.title;
        const description = lang === 'en' ? event.descriptionEn : event.description;
        const location = lang === 'en' ? event.locationEn : event.location;
        const addToCalendar = lang === 'en' ? 'Add to Calendar' : 'कैलेंडर में जोड़ें';
        const googleCalendar = lang === 'en' ? 'Google Calendar' : 'Google कैलेंडर';
        const outlookCalendar = lang === 'en' ? 'Outlook' : 'Outlook';
        
        // Safely format date and time
        let formattedDate = event.date;
        let formattedTime = event.time;
        try {
            formattedDate = formatDate(event.date);
        } catch (e) {
            console.warn('Error formatting date for event', event.id, e);
        }
        try {
            formattedTime = formatTime(event.time);
        } catch (e) {
            console.warn('Error formatting time for event', event.id, e);
        }
        
        return `
            <div class="event-card">
                <div class="event-image">
                    <img src="${event.image || '/static/images/1.jpeg'}" alt="${title}" onerror="this.src='/static/images/1.jpeg'">
                </div>
                <div class="event-content">
                    <div class="event-date-time">
                        <span class="event-date">${formattedDate}</span>
                        <span class="event-time">${formattedTime}</span>
                    </div>
                    <h3 class="event-title">${title}</h3>
                    <div class="event-location">
                        <span class="location-icon">📍</span>
                        <span>${location}</span>
                    </div>
                    <p class="event-description">${description}</p>
                    <div class="event-actions">
                        <div class="calendar-buttons">
                            <a href="${generateGoogleCalendarUrl(event)}" target="_blank" class="calendar-btn google">
                                <span>${googleCalendar}</span>
                            </a>
                            <a href="${generateOutlookCalendarUrl(event)}" target="_blank" class="calendar-btn outlook">
                                <span>${outlookCalendar}</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        }).join('');
        
        console.log('Generated HTML length:', html.length);
        
        // Clear grid completely first
        grid.innerHTML = '';
        
        // Remove loading message
        const loadingMsg = document.getElementById('loadingMessage');
        if (loadingMsg) {
            loadingMsg.remove();
        }
        
        // Set the HTML
        grid.innerHTML = html;
        console.log('Events rendered successfully!');
        console.log('Grid innerHTML length:', grid.innerHTML.length);
        console.log('Grid children count:', grid.children.length);
        return true;
    } catch (error) {
        console.error('Error rendering events:', error);
        grid.innerHTML = `<div class="no-events"><p>Error rendering events: ${error.message}</p></div>`;
        return false;
    }
}

// Calendar Functions
let currentDate = new Date();
let selectedDate = null;

function renderCalendar() {
    if (window.skipJsCalendarRender) {
        console.log('Skipping JS calendar render (handled in template).');
        return;
    }
    const grid = document.getElementById('calendarGrid');
    const monthYear = document.getElementById('calendarMonthYear');
    if (!grid || !monthYear) {
        console.log('Calendar elements not found');
        return;
    }
    
    console.log('Rendering calendar...');
    
    const lang = getCurrentLanguage();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month/year display
    const monthNames = lang === 'en' 
        ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        : ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
    
    monthYear.textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    // Get dates with events - use window.eventsData if available
    const dataToUse = window.eventsData || eventsData || [];
    const eventDates = new Set(dataToUse.map(e => e.date));
    console.log('Event dates found:', eventDates.size);
    
    // Clear grid
    grid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = lang === 'en'
        ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        : ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
    
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Check if today
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Check if has events
        if (eventDates.has(dateString)) {
            dayElement.classList.add('has-event');
        }
        
        // Check if selected
        if (selectedDate && selectedDate === dateString) {
            dayElement.classList.add('selected');
        }
        
        dayElement.addEventListener('click', () => selectDate(dateString));
        grid.appendChild(dayElement);
    }
}

function selectDate(dateString) {
    if (window.skipJsCalendarRender) {
        return;
    }
    selectedDate = dateString;
    renderCalendar();
    showDateEvents(dateString);
}

function showDateEvents(dateString) {
    if (window.skipJsCalendarRender) {
        return;
    }
    const container = document.getElementById('selectedDateEvents');
    if (!container) {
        console.log('selectedDateEvents container not found');
        return;
    }
    
    const lang = getCurrentLanguage();
    const dataToUse = window.eventsData || eventsData || [];
    const dateEvents = dataToUse.filter(e => e.date === dateString);
    console.log('Events for', dateString, ':', dateEvents.length);
    
    if (dateEvents.length === 0) {
        const noEvents = lang === 'en' ? 'No events scheduled for this date.' : 'इस तारीख के लिए कोई कार्यक्रम निर्धारित नहीं है।';
        container.innerHTML = `
            <div class="no-events-message">
                <p>${noEvents}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <h3 class="selected-date-title">${formatDate(dateString)}</h3>
        <div class="date-events-list">
            ${dateEvents.map(event => {
                const title = lang === 'en' ? event.titleEn : event.title;
                const description = lang === 'en' ? event.descriptionEn : event.description;
                const location = lang === 'en' ? event.locationEn : event.location;
                
                return `
                    <div class="date-event-item">
                        <div class="date-event-time">${formatTime(event.time)}</div>
                        <div class="date-event-content">
                            <h4>${title}</h4>
                            <p class="date-event-location">📍 ${location}</p>
                            <p class="date-event-description">${description}</p>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function changeMonth(direction) {
    if (window.skipJsCalendarRender) {
        return;
    }
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
    // Re-show events for selected date if one is selected
    if (selectedDate) {
        showDateEvents(selectedDate);
    }
}

// Tab Switching
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.events-section');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active section
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(`${targetTab}Section`).classList.add('active');
            
            // If switching to calendar, render it
            if (targetTab === 'calendar') {
                renderCalendar();
            }
        });
    });
}

// Initialize
function initializeEvents() {
    console.log('Initializing events page...');
    console.log('Events data length:', eventsData ? eventsData.length : 0);
    
    // Check if we're on events page
    const grid = document.getElementById('eventsGrid');
    if (!grid) {
        console.log('Not on events page, skipping initialization');
        return;
    }
    
    // Render client-side list only if needed
    if (!window.skipJsEventRender) {
        console.log('Rendering events immediately...');
        renderEvents();
    } else {
        console.log('Server rendered events, skipping client render.');
    }
    
    // Wait a bit for DOM to be fully ready for tabs
    setTimeout(() => {
        initTabs();
        
        // Calendar navigation
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        
        if (prevBtn) prevBtn.addEventListener('click', () => changeMonth(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => changeMonth(1));
        
        // Always render calendar so it has content when tab is opened
        renderCalendar();
    }, 100);
}

// Multiple initialization attempts
console.log('events.js: Document readyState:', document.readyState);
console.log('events.js: eventsData length:', eventsData ? eventsData.length : 'undefined');

if (document.readyState === 'loading') {
    console.log('events.js: Adding DOMContentLoaded listener');
    document.addEventListener('DOMContentLoaded', function() {
        console.log('events.js: DOMContentLoaded fired');
        initializeEvents();
    });
} else {
    // DOM already loaded
    console.log('events.js: DOM already loaded, calling initializeEvents immediately');
    setTimeout(initializeEvents, 100);
}

// Also try on window load as fallback
window.addEventListener('load', function() {
    console.log('events.js: Window load fired');
    setTimeout(() => {
        const grid = document.getElementById('eventsGrid');
        if (grid) {
            console.log('events.js: Grid found on window.load, checking content...');
            if (grid.innerHTML.trim() === '' || grid.innerHTML.includes('will be dynamically') || grid.innerHTML.includes('Loading')) {
                console.log('events.js: Grid is empty, re-rendering events...');
                renderEvents();
            } else {
                console.log('events.js: Grid already has content');
            }
        } else {
            console.log('events.js: Grid not found on window.load');
        }
    }, 500);
});

// Re-render on language change
window.addEventListener('languageChanged', function() {
    renderEvents();
    renderCalendar();
    if (selectedDate) {
        showDateEvents(selectedDate);
    }
});

// Make functions and data available globally for debugging
// IMPORTANT: Make these available immediately when script loads
// Set eventsData FIRST before anything else - use var to make it global
if (typeof window !== 'undefined') {
    window.eventsData = eventsData;
    console.log('events.js: window.eventsData set with', eventsData.length, 'events');
    
    // Also make it available as a global variable
    if (typeof eventsData !== 'undefined') {
        console.log('events.js: eventsData is available globally');
    }
}

window.renderEvents = renderEvents;
window.renderCalendar = renderCalendar;
window.changeMonth = changeMonth;
window.selectDate = selectDate;
window.showDateEvents = showDateEvents;

// Try to render immediately if we're on the events page
(function() {
    if (document.getElementById('eventsGrid')) {
        console.log('events.js: eventsGrid found, attempting immediate render...');
        setTimeout(function() {
            if (window.renderEvents) {
                console.log('events.js: Calling renderEvents immediately...');
                window.renderEvents();
            }
        }, 50);
    }
})();

// Don't override window.getCurrentLanguage if it's already set by language.js
if (!window.getCurrentLanguage) {
    window.getCurrentLanguage = getCurrentLanguage;
}

