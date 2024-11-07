const openModal = (modal) => {
    const newModal = new bootstrap.Modal(modal);
    newModal.show();
};

const closeModal = (modal) => {
    modal.hide();
};

export const Modal = {
    openModal,
    closeModal,
}