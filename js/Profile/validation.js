
const inputs = document.querySelectorAll('.input input');
const errors = document.querySelectorAll('.error-message');
const error = (input, message) => {
    input.classList.add('error');
    const errorElement = document.getElementById(`${input.id}Error`);
    errorElement.innerText = message;
}
const success = input => {
    input.classList.remove('error');
    errors[Array.from(inputs).indexOf(input)].innerText = "";
}
inputs.forEach(input => {
    input.addEventListener('input', () => {
        if (input.type === 'email') {
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
            if (!emailRegex.test(input.value)) {
                error(input, 'Please enter a valid email address');
            } else {
                success(input);
            }
        } else if (input.type === 'tel') {
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(input.value)) {
                error(input, 'Please enter a valid phone number');
            } else {
                success(input);
            }
        } else if (input.type === 'url') {
            const urlRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;
            if (!urlRegex.test(input.value)) {
                error(input, 'Please enter a valid url');
            } else {
                success(input);
            }
        } else {
            if (input.value.length < 3) {
                error(input, 'Please enter a valid value');
            } else {
                success(input);
            }
        }
    });
});


