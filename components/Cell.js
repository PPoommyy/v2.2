let currentEditModal;

const openModal = (modal) => {
    newModal = new bootstrap.Modal(modal);
    newModal.show();
};

const closeModal = (modal) => {
    modal.hide();
};

const openEditModal = (title, element, id, key, value) => {
    document.getElementById('editModalLabel').innerText = title;
    document.getElementById('editId').value = id;
    document.getElementById('editKey').value = key;
    element.value = value;
    const editValueContainer = document.getElementById('editValueContainer');
    editValueContainer.innerHTML = '';
    editValueContainer.append(element);
    currentEditModal = new bootstrap.Modal(document.getElementById('editModal'));
    currentEditModal.show();
};

const closeEditModal = () => {
    if (currentEditModal) {
        currentEditModal.hide();
    }
}

const createHeaderCell = (value, colSpan, rowSpan) => {
    const cell = document.createElement('th');
    const span = document.createElement('span');
    if (colSpan) cell.colSpan = colSpan;
    if (rowSpan) cell.rowSpan = rowSpan;
    span.innerText = value;
    cell.appendChild(span);
    return cell;
};

const createSpanCell = (value, colSpan, rowSpan, classList = null) => {
    const cell = document.createElement('td');
    const span = document.createElement('span');
    if (colSpan) cell.colSpan = colSpan;
    if (rowSpan) cell.rowSpan = rowSpan;
    if (classList) classList.forEach(className => cell.classList.add(className));
    
    span.innerText = value;
    cell.appendChild(span);
    return cell;
};

const createInputCell = (key, placeholder) => {
    const cell = document.createElement('td');
    const input = document.createElement('input');
    input.setAttribute('for', key);
    input.type = 'text';
    input.classList.add('form-control');
    input.placeholder = placeholder ? placeholder: 'Enter text...';
    cell.appendChild(input);
    return cell;
};



const createSelectCell = (options, key) => {
    const cell = document.createElement('td');
    const select = document.createElement('select');
    select.classList.add('form-select');
    select.setAttribute('for', key);
    options.forEach((option) => {
        const optionElement = document.createElement('option');
        optionElement.value = option.id;
        optionElement.text = option.name;
        select.appendChild(optionElement);
    });
    cell.appendChild(select);
    return cell;
};

const createInputOnModalCell = (title, id, key, value) => {
    const cell = document.createElement('td');
    const a = document.createElement('a');
    const input = document.createElement('input');
    input.type = 'text';
    input.classList.add('form-control');
    input.addEventListener('input', (e) => {
        const editValue = e.target.value;
        document.getElementById('editValue').value = editValue;
    });
    a.innerText = value;
    a.classList.add('link-primary')
    a.addEventListener('click', () => {
        document.getElementById('editValue').value = null;
        openEditModal(`Enter ${title}`, input, id, key, value);
    });
    cell.appendChild(a);
    return cell;
};

const createSelectOnModalCell = (title, options, id, key, value) => {
    const cell = document.createElement('td');
    const a = document.createElement('a');
    const select = document.createElement('select');
    select.classList.add('form-select');

    options.forEach((option, index) => {
        const optionElement = document.createElement('option');
        optionElement.value = option.id;
        optionElement.text = option.name;
        select.appendChild(optionElement);
    });

    select.addEventListener('change', (e) => {
        const editValue = e.target.value;
        document.getElementById('editValue').value = editValue;
    });

    a.innerText = value;
    a.classList.add('link-primary')
    a.addEventListener('click', async () => {
        document.getElementById('editValue').value = options[0].id;
        openEditModal(`Select ${title}`, select, id, key, value);
    });

    cell.appendChild(a);
    return cell;
};

const createDeleteButtonCell = () => {
    const cell = document.createElement('td');
    const button = document.createElement('button');
    const icon = document.createElement('i');

    button.classList.add('btn', 'btn-danger');
    button.setAttribute('data-toggle', 'tooltip');

    icon.classList.add('fa-solid', 'fa-xmark');
    button.appendChild(icon);

    cell.classList.add('text-center')
    cell.colSpan = 2;
    cell.appendChild(button);
    return cell;
}

const createElementCell = (element, colSpan, rowSpan, classList) => {
    const cell = document.createElement('td');
    if (classList) {
        classList.forEach(className => cell.classList.add(className));
    }
    if (colSpan) cell.colSpan = colSpan;
    if (rowSpan) cell.rowSpan = rowSpan;

    if (Array.isArray(element)) {
        element.forEach(e => {
            cell.appendChild(e);
        });
    } else {
        cell.appendChild(element);
    }   
    
    return cell;
}

const createSwitchInputCell = (isEnable) => {
    const cell = document.createElement('td');
    const input = document.createElement('input');
    const div = document.createElement('div');

    input.classList.add('form-check-input');
    input.setAttribute('data-toggle', 'tooltip');
    input.type = 'checkbox';
    input.role = 'switch';
    input.checked = isEnable===1 || isEnable==="1";
    div.classList.add('form-check', 'form-switch');
    cell.classList.add('text-center');
    cell.colSpan = 2;
    div.appendChild(input);
    cell.appendChild(div);
    return cell;
}

export const Cell = {
    openModal,
    closeModal,
    closeEditModal,
    createHeaderCell,
    createSpanCell,
    createInputCell,
    createSelectCell,
    createDeleteButtonCell,
    createSwitchInputCell,
    createInputOnModalCell,
    createSelectOnModalCell,
    createElementCell
}