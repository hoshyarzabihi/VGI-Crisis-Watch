const map = L.map('map').setView([35.6892, 51.3890], 12);
        
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
}).addTo(map);
        
L.control.scale({position: 'bottomleft', metric: true, imperial: false}).addTo(map);
        
let selectedLat = null;
let selectedLng = null;
let selectedUrgency = 'medium';
let tempMarker = null;
let reports = [];
let reportId = 1;
        
function createDynamicMarker(lat, lng, type = 'environment') {
    const iconClass = `dynamic-marker marker-${type}`;
    const iconHtml = getIconForType(type);
    
    return L.marker([lat, lng], {
        icon: L.divIcon({
            className: iconClass,
            html: iconHtml,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        }),
        draggable: true
    });
}
        
function getIconForType(type) {
    switch(type) {
        case 'environment': return '<i class="fas fa-tree"></i>';
        case 'crisis': return '<i class="fas fa-exclamation-triangle"></i>';
        case 'damage': return '<i class="fas fa-home"></i>';
        default: return '<i class="fas fa-map-marker-alt"></i>';
    }
}
        
function updateCoordinates(lat, lng) {
    selectedLat = lat;
    selectedLng = lng;
    
    document.getElementById('latitudeDisplay').textContent = lat.toFixed(6);
    document.getElementById('longitudeDisplay').textContent = lng.toFixed(6);
    
    document.getElementById('latBox').classList.add('active');
    document.getElementById('lngBox').classList.add('active');
    
    if (tempMarker) {
        map.removeLayer(tempMarker);
    }
    
    const type = document.getElementById('reportType').value || 'environment';
    tempMarker = createDynamicMarker(lat, lng, type);
    tempMarker.addTo(map);
    
    tempMarker.bindPopup(`
        <div style="min-width: 200px;">
            <h4 style="margin: 0 0 10px 0;">موقعیت انتخاب‌شده</h4>
            <p style="margin: 5px 0;"><strong>عرض:</strong> ${lat.toFixed(6)}</p>
            <p style="margin: 5px 0;"><strong>طول:</strong> ${lng.toFixed(6)}</p>
            <p style="margin: 5px 0; font-size: 0.9em; color: #666;">برای جابجایی، نشانگر را بکشید</p>
        </div>
    `).openPopup();
    
    tempMarker.on('dragend', function(e) {
        const newPos = e.target.getLatLng();
        updateCoordinates(newPos.lat, newPos.lng);
    });
}
        
map.on('click', function(e) {
    updateCoordinates(e.latlng.lat, e.latlng.lng);
});
        
document.getElementById('locateBtn').addEventListener('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            updateCoordinates(lat, lng);
            map.setView([lat, lng], 15);
            
            showNotification('موقعیت شما با موفقیت مشخص شد.', 'success');
        }, function(error) {
            showNotification('دسترسی به موقعیت میسر نشد.', 'error');
        });
    } else {
        showNotification('مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند.', 'error');
    }
});
        
document.getElementById('resetBtn').addEventListener('click', function() {
    map.setView([35.6892, 51.3890], 12);
    
    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
    
    selectedLat = null;
    selectedLng = null;
    document.getElementById('latitudeDisplay').textContent = '--.--';
    document.getElementById('longitudeDisplay').textContent = '--.--';
    
    document.getElementById('latBox').classList.remove('active');
    document.getElementById('lngBox').classList.remove('active');
    
    showNotification('نقشه و موقعیت بازنشانی شد.', 'info');
});
        
document.getElementById('reportType').addEventListener('change', function() {
    if (tempMarker && selectedLat && selectedLng) {
        map.removeLayer(tempMarker);
        tempMarker = createDynamicMarker(selectedLat, selectedLng, this.value);
        tempMarker.addTo(map);
        
        tempMarker.bindPopup(`
            <div style="min-width: 200px;">
                <h4 style="margin: 0 0 10px 0;">موقعیت انتخاب‌شده</h4>
                <p style="margin: 5px 0;"><strong>عرض:</strong> ${selectedLat.toFixed(6)}</p>
                <p style="margin: 5px 0;"><strong>طول:</strong> ${selectedLng.toFixed(6)}</p>
                <p style="margin: 5px 0;"><strong>نوع:</strong> ${getTypeLabel(this.value)}</p>
            </div>
        `).openPopup();
    }
});
        
document.querySelectorAll('.urgency-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.urgency-btn').forEach(b => {
            b.classList.remove('active');
        });
        
        this.classList.add('active');
        
        selectedUrgency = this.dataset.level;
        document.getElementById('urgencyLevel').value = selectedUrgency;
        
        const urgencyLabels = {
            low: 'کم',
            medium: 'متوسط', 
            high: 'زیاد',
            critical: 'بحرانی'
        };
        showNotification(`سطح فوریت به "${urgencyLabels[selectedUrgency]}" تغییر کرد.`, 'info');
    });
});
        
document.getElementById('reportForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const type = document.getElementById('reportType').value;
    const title = document.getElementById('reportTitle').value;
    const description = document.getElementById('reportDescription').value;
    
    if (!type) {
        showNotification('لطفاً نوع گزارش را انتخاب کنید.', 'error');
        return;
    }
    
    if (!selectedLat || !selectedLng) {
        showNotification('لطفاً موقعیت حادثه را روی نقشه مشخص کنید.', 'error');
        return;
    }
    
    if (!title.trim()) {
        showNotification('لطفاً عنوان گزارش را وارد کنید.', 'error');
        return;
    }
    
    if (!description.trim()) {
        showNotification('لطفاً شرح گزارش را وارد کنید.', 'error');
        return;
    }
    
    const now = new Date();
    const report = {
        id: reportId++,
        type: type,
        title: title,
        description: description,
        lat: selectedLat,
        lng: selectedLng,
        urgency: selectedUrgency,
        timestamp: now.getTime(),
        date: now.toLocaleDateString('fa-IR'),
        time: now.toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})
    };
    
    reports.unshift(report);
    
    displayReport(report);
    
    showSuccessMessage(report);
    
    this.reset();
    
    document.querySelectorAll('.urgency-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.urgency-btn.medium').classList.add('active');
    selectedUrgency = 'medium';
    document.getElementById('urgencyLevel').value = 'medium';
    
    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
    selectedLat = null;
    selectedLng = null;
    document.getElementById('latitudeDisplay').textContent = '--.--';
    document.getElementById('longitudeDisplay').textContent = '--.--';
    document.getElementById('latBox').classList.remove('active');
    document.getElementById('lngBox').classList.remove('active');
    
    updateReportCount();
});
        
function displayReport(report) {
    const reportsContainer = document.getElementById('reportsContainer');
    
    const reportCard = document.createElement('div');
    reportCard.className = 'report-card';
    reportCard.innerHTML = `
        <div class="report-header">
            <span class="report-type ${report.type}">${getTypeLabel(report.type)}</span>
            <span style="font-size: 0.85rem; color: #6c757d;">
                <i class="fas fa-clock"></i> ${report.time}
            </span>
        </div>
        <h3 style="margin-bottom: 10px; font-size: 1.1rem;">${report.title}</h3>
        <p style="color: #555; margin-bottom: 10px;">${report.description}</p>
        <div class="report-coordinates">
            <i class="fas fa-map-pin"></i>
            ${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
            <span style="font-size: 0.85rem; padding: 4px 10px; border-radius: 15px; background: ${getUrgencyColor(report.urgency)}; color: white;">
                ${getUrgencyLabel(report.urgency)}
            </span>
            <button class="map-btn" onclick="zoomToReport(${report.lat}, ${report.lng})" style="font-size: 0.85rem; padding: 5px 12px;">
                <i class="fas fa-search-location"></i>
                مشاهده روی نقشه
            </button>
        </div>
    `;
    
    reportsContainer.prepend(reportCard);
}
        
function showSuccessMessage(report) {
    const successMessage = document.getElementById('successMessage');
    const successDetails = document.getElementById('successDetails');
    const reportTime = document.getElementById('reportTime');
    
    successDetails.innerHTML = `
        گزارش <strong>"${report.title}"</strong> با موقعیت 
        <strong>${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}</strong>
        و سطح فوریت <strong>${getUrgencyLabel(report.urgency)}</strong> ثبت شد.
    `;
    
    reportTime.textContent = `ثبت شده در ${report.date} ساعت ${report.time}`;
    
    successMessage.style.display = 'block';
    
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 8000);
}
        
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            left: 20px;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideInRight 0.3s ease;
        ">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
        
function zoomToReport(lat, lng) {
    map.setView([lat, lng], 15);
    
    if (tempMarker) {
        map.removeLayer(tempMarker);
    }
    
    tempMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'selected-location-marker',
            html: '<div style="background: #e74c3c; width: 50px; height: 50px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 20px rgba(231, 76, 60, 0.7); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;"><i class="fas fa-eye"></i></div>',
            iconSize: [50, 50],
            iconAnchor: [25, 50]
        })
    }).addTo(map);
    
    tempMarker.bindPopup('موقعیت گزارش انتخاب‌شده').openPopup();
    
    updateCoordinates(lat, lng);
}
        
function updateReportCount() {
    const count = reports.length;
    document.getElementById('reportCount').textContent = `${count} گزارش`;
}
        
function getTypeLabel(type) {
    switch(type) {
        case 'environment': return 'محیط‌زیستی';
        case 'crisis': return 'بحران';
        case 'damage': return 'خسارت';
        default: return 'نامشخص';
    }
}
        
function getUrgencyLabel(urgency) {
    switch(urgency) {
        case 'low': return 'فوریت کم';
        case 'medium': return 'فوریت متوسط';
        case 'high': return 'فوریت زیاد';
        case 'critical': return 'وضعیت بحرانی';
        default: return 'نامشخص';
    }
}
        
function getUrgencyColor(urgency) {
    switch(urgency) {
        case 'low': return '#27ae60';
        case 'medium': return '#f39c12';
        case 'high': return '#e74c3c';
        case 'critical': return '#c0392b';
        default: return '#3498db';
    }
}
        
function addSampleReports() {
    const sampleReports = [
        {
            id: reportId++,
            type: 'environment',
            title: 'آلودگی هوا در مرکز شهر',
            description: 'شاخص کیفیت هوا به بالای ۱۵۰ رسیده است. وضعیت برای گروه‌های حساس ناسالم است.',
            lat: 35.6892,
            lng: 51.3890,
            urgency: 'high',
            date: '۱۴۰۲/۰۶/۲۰',
            time: '۱۰:۳۰'
        },
        {
            id: reportId++,
            type: 'crisis',
            title: 'سیل در منطقه شمال تهران',
            description: 'بارش شدید باران باعث آبگرفتگی معابر و احتمال وقوع سیل شده است.',
            lat: 35.8010,
            lng: 51.5020,
            urgency: 'critical',
            date: '۱۴۰۲/۰۶/۱۹',
            time: '۱۶:۴۵'
        }
    ];
    
    sampleReports.forEach(report => {
        reports.push(report);
        displayReport(report);
    });
    
    updateReportCount();
}
        
addSampleReports();
        
setTimeout(() => {
    showNotification('برای شروع، روی نقشه کلیک کنید تا موقعیت حادثه را مشخص نمایید.', 'info');
}, 1000);

if (window.innerWidth <= 768) {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            const helpPanel = document.getElementById('mobileHelp');
            helpPanel.style.display = helpPanel.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            const section = this.dataset.section;
            
            switch(section) {
                case 'form':
                    document.querySelector('.form-section').scrollIntoView({behavior: 'smooth'});
                    break;
                case 'map':
                    document.querySelector('.map-section').scrollIntoView({behavior: 'smooth'});
                    break;
                case 'reports':
                    document.querySelector('.recent-reports').scrollIntoView({behavior: 'smooth'});
                    break;
                case 'help':
                    document.getElementById('mobileHelp').style.display = 'block';
                    break;
            }
        });
    });
    
    const closeHelpBtn = document.querySelector('.close-help');
    if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', function() {
            document.getElementById('mobileHelp').style.display = 'none';
        });
    }
    
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    
    document.getElementById('map').addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.querySelectorAll('button, .map-btn, .urgency-btn').forEach(btn => {
        btn.style.cursor = 'pointer';
        btn.addEventListener('touchstart', function() {
            this.style.opacity = '0.7';
        });
        btn.addEventListener('touchend', function() {
            this.style.opacity = '1';
        });
    });
}

window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) {
        document.getElementById('map').style.height = '350px';
        
        setTimeout(() => {
            map.invalidateSize();
        }, 300);
    }
});

if ('ontouchstart' in window || navigator.maxTouchPoints) {
    document.body.classList.add('touch-device');
}

if ('scrollBehavior' in document.documentElement.style) {
} else {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}