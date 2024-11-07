const showSuccessMessage = (message = 'successfully!') => {
    Swal.fire({
        icon: 'success',
        title: 'Successful',
        text: message,
        position: 'bottom-left',
        timer: 3000,
        showConfirmButton: false,
    });
};

const showErrorMessage = (message = 'An error occurred.') => {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        position: 'bottom-left',
        timer: 3000,
        showConfirmButton: false,
    });
};

const showConfirmModal = (message = 'successfully!') => {
    return Swal.fire({
        title: 'Confirmation',
        text: message,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
    });
};

const createQueue = () => {
    return Swal.mixin({
        title: 'Inserting Rows',
        icon: 'info',
        confirmButtonText: 'Next &rarr;',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        cancelButtonColor: '#d33',
        position: 'bottom-left',
    });
}

const insertToQueue = (message) => {
    return {
        value: message,
        confirmed: true
    };
}

const showNextButtonSuccess = (swal, message) => {
    swal.fire({
        title: `Row ${index + 1} inserted successfully!`,
        icon: 'success',
        showCancelButton: false,
        showConfirmButton: true,
        confirmButtonText: 'Next &rarr;',
    });
}

const showNextButtonError = (swal, message) => {
    swal.fire({
        title: `Row ${index + 1} inserted successfully!`,
        icon: 'error',
        showCancelButton: false,
        showConfirmButton: true,
        confirmButtonText: 'Next &rarr;',
    });
}

const fire = ({ title, text, icon }) => {
    swal.fire({
        title: title,
        text: text,
        icon: icon,
    })
}

export const Alert = { 
    fire,
    showErrorMessage, 
    showSuccessMessage,
    showConfirmModal,
    createQueue,
    showNextButtonSuccess,
    showNextButtonError
};