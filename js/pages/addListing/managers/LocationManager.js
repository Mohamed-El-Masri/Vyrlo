export class LocationManager {
    constructor() {
        this.map = null;
        this.marker = null;
        this.geocoder = new google.maps.Geocoder();
        this.searchBox = null;
        this.defaultLocation = { lat: 30.0444, lng: 31.2357 }; // Cairo coordinates
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        // Remove initializeValidation call since we're not using it separately
        this.initializeMap();
        this.initializeSearchBox();
        this.initializeCurrentLocation();
    }

    initializeMap() {
        this.map = new google.maps.Map(document.getElementById('locationMap'), {
            zoom: 13,
            center: this.defaultLocation,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            styles: [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                }
            ]
        });

        // Add marker
        this.marker = new google.maps.Marker({
            map: this.map,
            draggable: true,
            animation: google.maps.Animation.DROP,
            position: this.defaultLocation
        });

        // Add marker drag event
        this.marker.addListener('dragend', () => {
            const position = this.marker.getPosition();
            this.updateLocationDetails(position);
        });

        // Add map click event
        this.map.addListener('click', (e) => {
            this.marker.setPosition(e.latLng);
            this.updateLocationDetails(e.latLng);
        });
    }

    initializeSearchBox() {
        const input = document.getElementById('addressSearch');
        this.searchBox = new google.maps.places.SearchBox(input);

        // إضافة تحقق عند الكتابة
        input.addEventListener('input', () => {
            const addressResult = this.validateAddress(input.value);
            this.showValidationMessage(input, addressResult);
        });

        this.searchBox.addListener('places_changed', () => {
            const places = this.searchBox.getPlaces();
            if (places.length === 0) {
                this.showValidationMessage(input, {
                    isValid: false,
                    message: 'No places found',
                    type: 'error'
                });
                return;
            }

            const place = places[0];
            if (!place.geometry) {
                this.showValidationMessage(input, {
                    isValid: false,
                    message: 'Invalid place selected',
                    type: 'error'
                });
                return;
            }

            // تحديث الخريطة والعلامة
            if (place.geometry.viewport) {
                this.map.fitBounds(place.geometry.viewport);
            } else {
                this.map.setCenter(place.geometry.location);
                this.map.setZoom(17);
            }

            this.marker.setPosition(place.geometry.location);
            this.updateLocationDetails(place.geometry.location, place.formatted_address);
        });
    }

    initializeCurrentLocation() {
        const locationBtn = document.querySelector('.btn-current-location');
        if (!locationBtn) return;

        locationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                locationBtn.disabled = true;
                locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const pos = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };

                        this.map.setCenter(pos);
                        this.map.setZoom(17);
                        this.marker.setPosition(pos);
                        this.updateLocationDetails(pos);

                        locationBtn.disabled = false;
                        locationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
                    },
                    (error) => {
                        console.error('Error getting location:', error);
                        locationBtn.disabled = false;
                        locationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
                        // Show error message to user
                        this.showError('Could not get your location. Please try again.');
                    }
                );
            }
        });
    }

    updateLocationDetails(location, formattedAddress = null) {
        // Fix the lat/lng extraction based on the source
        let lat, lng;
        
        if (location instanceof google.maps.LatLng) {
            lat = location.lat();
            lng = location.lng();
        } else if (location.lat && typeof location.lat !== 'function') {
            // Handle plain object with lat/lng properties
            lat = location.lat;
            lng = location.lng;
        } else {
            console.error('Invalid location format');
            return;
        }

        // Update hidden inputs
        const latitudeInput = document.getElementById('latitude');
        const longitudeInput = document.getElementById('longitude');
        
        if (latitudeInput && longitudeInput) {
            latitudeInput.value = lat;
            longitudeInput.value = lng;
        }

        if (formattedAddress) {
            const formattedAddressInput = document.getElementById('formattedAddress');
            if (formattedAddressInput) {
                formattedAddressInput.value = formattedAddress;
                this.validateLocation();
            }
        } else {
            this.geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const formattedAddressInput = document.getElementById('formattedAddress');
                    if (formattedAddressInput) {
                        formattedAddressInput.value = results[0].formatted_address;
                        this.validateLocation();
                    }
                }
            });
        }
    }

    validateLocation() {
        const addressInput = document.getElementById('addressSearch');
        const formattedAddress = document.getElementById('formattedAddress');
        const lat = document.getElementById('latitude');
        const lng = document.getElementById('longitude');

        // تحقق من حقل البحث
        const addressResult = this.validateAddress(addressInput.value);
        this.showValidationMessage(addressInput, addressResult);

        // تحقق من العنوان المنسق
        const formattedAddressResult = this.validateAddress(formattedAddress.value);
        
        // تحقق من الإحداثيات
        const coordinatesResult = this.validateCoordinates(lat.value, lng.value);

        // إظهار رسائل التحقق
        if (!coordinatesResult.isValid || !formattedAddressResult.isValid) {
            this.showValidationMessage(addressInput, {
                isValid: false,
                message: 'Please select a valid location on the map',
                type: 'error'
            });
            return false;
        }

        this.showValidationMessage(addressInput, {
            isValid: true,
            message: 'Location selected successfully',
            type: 'success'
        });

        return true;
    }

    showValidationMessage(input, result) {
        if (!input || !result) return;

        const wrapper = input.closest('.input-wrapper');
        if (!wrapper) return;

        const messageEl = wrapper.querySelector('.validation-message');
        if (!messageEl) return;

        // إزالة الحالات السابقة
        input.classList.remove('is-invalid', 'is-warning', 'is-valid');
        messageEl.classList.remove('error', 'warning', 'success');

        // إضافة الحالة الجديدة
        if (result.type === 'error') {
            input.classList.add('is-invalid');
            messageEl.classList.add('error');
        } else if (result.type === 'warning') {
            input.classList.add('is-warning');
            messageEl.classList.add('warning');
        } else if (result.type === 'success') {
            input.classList.add('is-valid');
            messageEl.classList.add('success');
        }

        messageEl.textContent = result.message;
        messageEl.style.display = result.message ? 'block' : 'none';
    }

    validateAddress(address) {
        if (!address || address.trim().length < 10) {
            return {
                isValid: false,
                message: 'Please enter a complete address (minimum 10 characters)',
                type: 'error'
            };
        }

        return {
            isValid: true,
            message: 'Valid address',
            type: 'success'
        };
    }

    validateCoordinates(lat, lng) {
        // تحقق من وجود الإحداثيات
        if (!lat || !lng) {
            return {
                isValid: false,
                message: 'Please select a location on the map',
                type: 'error'
            };
        }

        // تحقق من صحة نطاق الإحداثيات
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);

        if (isNaN(latNum) || isNaN(lngNum)) {
            return {
                isValid: false,
                message: 'Invalid coordinates',
                type: 'error'
            };
        }

        if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
            return {
                isValid: false,
                message: 'Coordinates out of range',
                type: 'error'
            };
        }

        return {
            isValid: true,
            message: 'Valid location',
            type: 'success'
        };
    }

    showError(message) {
        const searchWrapper = document.querySelector('.search-wrapper');
        const errorDiv = searchWrapper.querySelector('.validation-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.add('error');
            errorDiv.style.display = 'block';
        }
    }
}
