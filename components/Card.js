const createCard = (title, contents) => {
    console.log(contents);
    const card = document.createElement('div');
    const cardBody = document.createElement('div');
    const cardTitle = document.createElement('h5');
    
    card.classList.add('card');
    cardBody.classList.add('card-body');
    cardTitle.classList.add('card-title');
    cardTitle.innerText = title;
    cardBody.appendChild(cardTitle);
    contents?cardBody.appendChild(contents):"";
    card.appendChild(cardBody);
    return card;
}

const createListGroups = (list, key) => {
    const listGroups = document.createElement('div');
    listGroups.classList.add('list-group');

    list.forEach((item) => {
        const listGroupsItems = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.classList.add('form-check-input', 'me-1');
        checkbox.type = "checkbox";
        
        const listGroupsItemsName = document.createElement('span');
        listGroupsItemsName.innerText = item[3];

        listGroupsItems.appendChild(checkbox);
        listGroupsItems.appendChild(listGroupsItemsName);

        listGroupsItems.classList.add('list-group-item');
        listGroups.appendChild(listGroupsItems);
    });

    return listGroups;
}
export const Card = {
    createCard,
    createListGroups
}