let currentEditModal; // This is your global variable for the modal instance

const openModal = (modal) => {
  newModal = new bootstrap.Modal(modal);
  newModal.show();
};

const closeModal = (modal) => {
  modal.hide();
};

const openEditModal = (title, elementToInsert, id, key /*, originalValue - not directly used if elementToInsert has it */) => {
  document.getElementById("editModalLabel").innerText = title;
  document.getElementById("editId").value = id;
  document.getElementById("editKey").value = key;
  // 'elementToInsert' should already have its value set by the calling function
  // For example, if it's an input, its .value is set. If a select, its selected option is set.

  const editValueContainer = document.getElementById("editValueContainer");
  if (!editValueContainer) {
    console.error("Fatal Error: editValueContainer not found in modal!");
    return; // Stop if container is missing
  }
  editValueContainer.innerHTML = ""; // Clear previous content
  editValueContainer.appendChild(elementToInsert); // Append the provided element

  // Manage Bootstrap Modal instance
  const modalDOMElement = document.getElementById("editModal");
    if (modalDOMElement) {
        currentEditModal = bootstrap.Modal.getOrCreateInstance(modalDOMElement);
        currentEditModal.show();
    } else {
        console.error("Modal element with ID 'editModal' not found.");
    }
};

const closeEditModal = () => {
  if (currentEditModal) {
    currentEditModal.hide();
  }
};

const createHeaderCell = (value, colSpan, rowSpan) => {
  const cell = document.createElement("th");
  const span = document.createElement("span");
  if (colSpan) cell.colSpan = colSpan;
  if (rowSpan) cell.rowSpan = rowSpan;
  span.innerText = value;
  cell.appendChild(span);
  return cell;
};

const createSpanCell = (value, colSpan, rowSpan, classList = null) => {
  const cell = document.createElement("td");
  const span = document.createElement("span");
  if (colSpan) cell.colSpan = colSpan;
  if (rowSpan) cell.rowSpan = rowSpan;
  if (classList)
    classList.forEach((className) => cell.classList.add(className));

  span.innerText = value;
  cell.appendChild(span);
  return cell;
};

// Cell.js
const createInputCell = (fieldKey, defaultValue = "", inputType = "text", isRequired = false) => {
    const cell = document.createElement("td");
    const input = document.createElement("input");
    input.type = inputType;
    input.classList.add("form-control", "form-control-sm");
    input.dataset.fieldKey = fieldKey; // Correct: Using dataset
    input.setAttribute("for", fieldKey); // 'for' is for labels, not ideal for this
    input.value = defaultValue;
    if (isRequired) {
        input.required = true;
    }
    cell.appendChild(input);
    return cell;
};

const createSelectInputCell = (options, key) => {
  const cell = document.createElement("td");
  const select = document.createElement("select");
  select.classList.add("form-select");
  select.setAttribute("for", key);
  select.setAttribute("name", key);
  options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option.id;
    optionElement.text = option.name;
    select.appendChild(optionElement);
  });
  cell.appendChild(select);
  return cell;
};

/* const createSelectCell = (options, key) => {
  const cell = document.createElement("td");
  const select = document.createElement("select");
  select.classList.add("form-select");
  select.setAttribute("for", key);
  options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option.id;
    optionElement.text = option.name;
    select.appendChild(optionElement);
  });
  cell.appendChild(select);
  return cell;
}; */

const createSelectCell = (options, key, defaultValueId = null, isRequired = false) => { // Added params from my previous suggestion
    const cell = document.createElement("td");
    const select = document.createElement("select");
    select.classList.add("form-select", "form-select-sm");
    select.dataset.fieldKey = key; // Use dataset for consistency
    if(isRequired) select.required = true;

    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = `--- Select ${key.replace('_id','')} ---`;
    select.appendChild(defaultOpt);

    if (Array.isArray(options)) {
        options.forEach((option) => {
            if(option && typeof option.id !== 'undefined' && typeof option.name !== 'undefined'){
                const optionElement = document.createElement("option");
                optionElement.value = option.id;
                optionElement.text = option.name;
                if (String(option.id) === String(defaultValueId)) {
                    optionElement.selected = true;
                }
                select.appendChild(optionElement);
            }
        });
    }
    cell.appendChild(select);
    return cell;
};

/* const createInputOnModalCell = (title, id, key, value) => {
  const cell = document.createElement("td");
  const input = document.createElement("input");
  const inputOnModal = document.createElement("input");
  inputOnModal.type = "text";
  inputOnModal.classList.add("form-control");
  inputOnModal.addEventListener("input", (e) => {
    const editValue = e.target.value;
    document.getElementById("editValue").value = editValue;
  });
  input.value = value;
  input.classList.add("form-control");
  input.addEventListener("click", () => {
    document.getElementById("editValue").value = null;
    openEditModal(`Enter ${title}`, inputOnModal, id, key, value);
  });
  cell.appendChild(input);
  return cell;
}; */

const createInputOnModalCell = (title, id, key, value, inputType = 'text') => { // Added inputType
  const cell = document.createElement("td");
  
  // This input is for display in the table cell
  const displayInput = document.createElement("input");
  displayInput.type = "text"; // Always text for display cell, readonly
  displayInput.classList.add("form-control", "form-control-sm", "editable-cell-display"); // Add a class to style it as non-editable
  displayInput.value = (value !== null && value !== undefined) ? value : 'N/A';
  displayInput.readOnly = true; // Make it look like text but still clickable
  
  // This input will be created and passed to the modal
  displayInput.addEventListener("click", () => {
    const inputForModal = document.createElement("input");
    inputForModal.type = inputType; // Use the specified input type for the modal
    inputForModal.classList.add("form-control");
    inputForModal.value = (value !== null && value !== undefined) ? value : ""; // Set its current value for editing
    
    // The old logic with `document.getElementById("editValue").value = null;` is removed
    // because openEditModal now handles appending the element.
    openEditModal(`Edit ${title}`, inputForModal, id, key, value); // Pass value for potential use if needed
  });

  cell.appendChild(displayInput);
  return cell;
};

const createSelectOnModalCell = (title, optionsArray, recordId, fieldKeyToUpdate, currentSelectedValueName, colSpan, rowSpan) => {
  const cell = document.createElement("td");
  if (colSpan) cell.colSpan = colSpan;
  if (rowSpan) cell.rowSpan = rowSpan;

  const displaySpan = document.createElement("span");
  displaySpan.textContent = currentSelectedValueName || 'N/A';
  displaySpan.classList.add("editable-cell-value");
  
  const editIcon = document.createElement("i");
  editIcon.classList.add("fas", "fa-pencil-alt", "ms-2", "text-primary", "cursor-pointer");
  // editIcon.title = `Edit ${title}`; // Tooltip initialization will be handled in sku_setting.js

  const wrapper = document.createElement("div");
  wrapper.classList.add("d-flex", "justify-content-between", "align-items-center", "w-100", "cursor-pointer");
  wrapper.title = `Edit ${title}`; // Set title on wrapper for tooltip
  wrapper.appendChild(displaySpan);
  wrapper.appendChild(editIcon);

  wrapper.addEventListener("click", async () => {
    // Create the select element that will be passed to openEditModal
    const selectForModal = document.createElement("select");
    selectForModal.classList.add("form-select");

    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.text = `--- Select ${title.split(' ').pop()} ---`;
    selectForModal.appendChild(defaultOpt);

    if (Array.isArray(optionsArray)) {
        optionsArray.forEach((option) => {
            if (option && typeof option.id !== 'undefined' && typeof option.name !== 'undefined') {
                const optionElement = document.createElement("option");
                optionElement.value = option.id;
                optionElement.text = option.name;
                if (String(option.name) === String(currentSelectedValueName)) {
                    optionElement.selected = true;
                }
                selectForModal.appendChild(optionElement);
            }
        });
    }
    // Pass the created selectForModal element to openEditModal
    openEditModal(`Select ${title}`, selectForModal, recordId, fieldKeyToUpdate);
  });

  cell.appendChild(wrapper);
  return cell;
};

const createDeleteButtonCell = () => {
  const cell = document.createElement("td");
  const button = document.createElement("button");
  const icon = document.createElement("i");

  button.classList.add("btn", "btn-sm", "btn-danger");
  button.setAttribute("data-toggle", "tooltip");

  icon.classList.add("fa-solid", "fa-xmark");
  button.appendChild(icon);

  cell.classList.add("text-center");
  cell.colSpan = 2;
  cell.appendChild(button);
  return cell;
};

const createEditButtonCell = () => {
  const cell = document.createElement("td");
  const button = document.createElement("button");
  const icon = document.createElement("i");

  button.classList.add("btn", "btn-warning");
  button.setAttribute("data-toggle", "tooltip");

  icon.classList.add("fa-solid", "fa-pen-to-square");
  button.appendChild(icon);

  cell.classList.add("text-center");
  cell.colSpan = 1;
  cell.appendChild(button);
  return cell;
};

const createElementCell = (element, colSpan, rowSpan, classList) => {
  const cell = document.createElement("td");
  if (classList) {
    classList.forEach((className) => cell.classList.add(className));
  }
  if (colSpan) cell.colSpan = colSpan;
  if (rowSpan) cell.rowSpan = rowSpan;

  if (Array.isArray(element)) {
    element.forEach((e) => {
      cell.appendChild(e);
    });
  } else {
    cell.appendChild(element);
  }

  return cell;
};

const createSwitchInputCell = (isEnable) => {
  const cell = document.createElement("td");
  const input = document.createElement("input");
  const div = document.createElement("div");

  input.classList.add("form-check-input");
  input.setAttribute("data-toggle", "tooltip");
  input.type = "checkbox";
  input.role = "switch";
  input.checked = isEnable === 1 || isEnable === "1";
  div.classList.add("form-check", "form-switch");
  cell.classList.add("text-center");
  cell.colSpan = 2;
  div.appendChild(input);
  cell.appendChild(div);
  return cell;
};

export const Cell = {
  openModal,
  closeModal,
  closeEditModal,
  createHeaderCell,
  createSpanCell,
  createInputCell,
  createSelectCell,
  createDeleteButtonCell,
  createEditButtonCell,
  createSwitchInputCell,
  createInputOnModalCell,
  createSelectInputCell,
  createSelectOnModalCell,
  createElementCell,
};
