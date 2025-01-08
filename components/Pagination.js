const updatePagination = (currentPage, totalPages, paginationId, generateTable) => {
    const paginationElement = document.getElementById(paginationId);
    const paginationList = paginationElement.querySelector('.pagination');
    paginationList.innerHTML = '';
    const prevPage = createPageLink(currentPage - 1, "Previous", generateTable);
    const nextPage = createPageLink(currentPage + 1, "Next", generateTable);
    const firstPage = createPageLink(1, "First", generateTable);
    const lastPage = createPageLink(totalPages, "Last", generateTable);
    const dropdown = createDropdownButton(currentPage, totalPages, generateTable);
    
    paginationList.appendChild(dropdown);
    paginationList.appendChild(firstPage);
    paginationList.appendChild(prevPage);
    paginationList.appendChild(nextPage);
    paginationList.appendChild(lastPage);

    if (totalPages > 1) {
        let startPage = Math.max(currentPage - 2, 1);
        let endPage = Math.min(startPage + 4, totalPages);

        for (let i = startPage; i <= endPage; i++) {
            const pageItem = createPageLink(i, i, generateTable);
            paginationList.appendChild(pageItem);
            if (i === currentPage) {
                pageItem.classList.add('active');
            }
        }
    }

    paginationList.appendChild(nextPage);
    paginationList.appendChild(lastPage);

    if (currentPage > 1) {
        prevPage.classList.remove('disabled');
        firstPage.classList.remove('disabled');
    } else {
        prevPage.classList.add('disabled');
        firstPage.classList.add('disabled');
    }

    if (currentPage < totalPages) {
        nextPage.classList.remove('disabled');
        lastPage.classList.remove('disabled');
    } else {
        nextPage.classList.add('disabled');
        lastPage.classList.add('disabled');
    }
};

const createPageLink = (pageNumber, name, generateTable) => {
    const page = document.createElement('li');
    page.classList.add('page-item');
    const link = document.createElement('a');

    link.classList.add('page-link');
    link.setAttribute('role', 'button');
    link.setAttribute('aria-label', `${name} Page ${pageNumber}`);
    link.setAttribute('page-number', pageNumber);
    link.textContent = name;
    link.addEventListener('click', function (event) {
        event.preventDefault();
        const limitDropdown = document.getElementById('limitDropdown');
        const selectedLimit = limitDropdown?limitDropdown.innerText:100;
        const selectedPage = parseInt(this.getAttribute('page-number'));
        console.log("selectedLimit", selectedLimit);
        console.log("selectedPage", selectedPage);
        generateTable(selectedLimit, selectedPage);
        this.parentElement.classList.add('active');
    });
    page.appendChild(link);
    return page;
}

const createDropdownButton = (currentPage, totalPages, generateTable) => {
    const dropdown = document.createElement('li');
    dropdown.classList.add('page-item', 'dropdown');

    const dropdownButton = document.createElement('a');
    dropdownButton.classList.add('page-link', 'dropdown-toggle');
    dropdownButton.setAttribute('role', 'button');
    dropdownButton.setAttribute('id', 'pageDropdown');
    dropdownButton.setAttribute('data-bs-toggle', 'dropdown');
    dropdownButton.setAttribute('aria-haspopup', 'true');
    dropdownButton.setAttribute('aria-expanded', 'false');
    dropdownButton.textContent = currentPage;

    const dropdownMenu = document.createElement('ul');
    dropdownMenu.classList.add('dropdown-menu', 'p-0');
    dropdownMenu.setAttribute('aria-labelledby', 'pageDropdown');
    dropdownMenu.style.maxHeight = '400px';
    dropdownMenu.style.overflowY = 'auto';

    dropdownButton.addEventListener('click', function (event) {
        event.preventDefault();
    });

    for (let i = 1; i <= totalPages; i++) {
        const dropdownItem = createPageLink(i, i, generateTable);
        dropdownMenu.appendChild(dropdownItem);
    }

    dropdown.appendChild(dropdownButton);
    dropdown.appendChild(dropdownMenu);
    return dropdown;
}

export const Pagination = {
    updatePagination
}