document.addEventListener('DOMContentLoaded', function () {
    const componentTable = document.getElementById('componentTable').getElementsByTagName('tbody')[0];
    const zeroStockTable = document.getElementById('zeroStockTable').getElementsByTagName('tbody')[0];
    const addBtn = document.getElementById('addBtn');
    const searchBtn = document.getElementById('searchBtn');
    const printBtn = document.getElementById('printBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    const saveComponentBtn = document.getElementById('saveComponentBtn');
    const componentModal = new bootstrap.Modal(document.getElementById('componentModal'));
    const componentForm = document.getElementById('componentForm');

    let components = JSON.parse(localStorage.getItem('components')) || [];
    let editIndex = null;
    let filteredComponents = [];

    // Funzione per aggiornare le tabelle
    function updateTables(componentsToShow = components) {
        componentTable.innerHTML = '';
        zeroStockTable.innerHTML = '';

        if (componentsToShow.length === 0) {
            const row = componentTable.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 4;
            cell.textContent = 'Nessun componente trovato';
            cell.className = 'text-center text-muted';
        } else {
            componentsToShow.forEach((component, index) => {
                const row = component.quantity == 0 ? zeroStockTable.insertRow() : componentTable.insertRow();
                row.insertCell(0).textContent = component.name;
                row.insertCell(1).textContent = component.quantity;
                row.insertCell(2).textContent = component.location;
                const actionsCell = row.insertCell(3);
                actionsCell.className = 'actions';

                const editBtn = document.createElement('button');
                editBtn.textContent = 'Modifica';
                editBtn.className = 'btn btn-warning btn-sm';
                editBtn.addEventListener('click', () => openEditModal(component));
                actionsCell.appendChild(editBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Elimina';
                deleteBtn.className = 'btn btn-danger btn-sm';
                deleteBtn.addEventListener('click', () => deleteComponent(component));
                actionsCell.appendChild(deleteBtn);
            });
        }
    }

    // Apri il modal per aggiungere/modificare un componente
    function openEditModal(component = null) {
        if (component) {
            editIndex = components.findIndex(c => c.name === component.name && c.quantity === component.quantity && c.location === component.location);
            document.getElementById('componentName').value = component.name;
            document.getElementById('componentQuantity').value = component.quantity;
            document.getElementById('componentLocation').value = component.location;
        } else {
            editIndex = null;
            componentForm.reset();
        }
        componentModal.show();
    }

    // Salva il componente
    saveComponentBtn.addEventListener('click', function () {
        const name = document.getElementById('componentName').value;
        const quantity = Number(document.getElementById('componentQuantity').value);
        const location = document.getElementById('componentLocation').value;

        if (name && !isNaN(quantity) && location) {
            const component = { name, quantity, location };
            if (editIndex !== null) {
                components[editIndex] = component;
            } else {
                components.push(component);
            }
            localStorage.setItem('components', JSON.stringify(components));
            updateTables(filteredComponents.length > 0 ? filteredComponents : components);
            componentModal.hide();
        } else {
            alert("Compila tutti i campi correttamente!");
        }
    });

    // Elimina un componente
    function deleteComponent(component) {
        if (confirm("Sei sicuro di voler eliminare questo componente?")) {
            const index = components.findIndex(c => c.name === component.name && c.quantity === component.quantity && c.location === component.location);
            if (index !== -1) {
                components.splice(index, 1);
                localStorage.setItem('components', JSON.stringify(components));
                updateTables(filteredComponents.length > 0 ? filteredComponents : components);
            }
        }
    }

    // Cerca un componente
    searchBtn.addEventListener('click', function () {
        const searchTerm = prompt("Cerca componente per nome:").toLowerCase();
        if (searchTerm) {
            filteredComponents = components.filter(component => component.name.toLowerCase().includes(searchTerm));
            updateTables(filteredComponents);
        } else {
            filteredComponents = [];
            updateTables(components);
        }
    });

    // Stampa la lista
    printBtn.addEventListener('click', function () {
        window.print();
    });

    // Esporta i componenti in formato JSON (gestione per Android inclusa)
    exportBtn.addEventListener('click', function () {
        try {
            const dataStr = JSON.stringify(components, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const file = new File([blob], 'components.json', { type: 'application/json' });

            // Tentativo di esportazione con navigator.share (Android)
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({ files: [file], title: 'Componenti ElectroTrack', text: 'Lista componenti' })
                    .then(() => {
                        console.log('Condivisione riuscita');
                        alert("File esportato con successo!"); // Mostra un messaggio di conferma
                    })
                    .catch((error) => {
                        console.error('Errore nella condivisione (navigator.share):', error);
                        // Fallback: mostra il testo JSON per la copia manuale
                        mostraTestoJsonPerCopia(dataStr);
                    });
            } else {
                // Fallback: mostra il testo JSON per la copia manuale (PC e Android senza navigator.share)
                mostraTestoJsonPerCopia(dataStr);
            }
        } catch (error) {
            console.error("Errore durante l'esportazione:", error);
            alert("Si è verificato un errore durante l'esportazione dei dati. Controlla la console per maggiori dettagli.");
        }
    });

    function mostraTestoJsonPerCopia(dataStr) {
        alert("Esportazione non supportata. Puoi copiare il testo JSON qui sotto:");
        const textarea = document.createElement('textarea');
        textarea.value = dataStr;
        textarea.rows = 10;
        textarea.cols = 50;
        document.body.appendChild(textarea);
        // Aggiungi un bottone per consentire all'utente di selezionare tutto il testo più facilmente
        const selectAllButton = document.createElement('button');
        selectAllButton.textContent = 'Seleziona tutto';
        selectAllButton.onclick = () => textarea.select();
        document.body.appendChild(selectAllButton);
    }

    // Gestisci l'importazione dei componenti
    importBtn.addEventListener('click', function () {
        importFile.click();
    });

    importFile.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const importedComponents = JSON.parse(e.target.result);
                    components = importedComponents;
                    localStorage.setItem('components', JSON.stringify(components));
                    updateTables();
                    alert("Componenti importati con successo!");
                } catch (error) {
                    alert("Errore durante l'importazione. Assicurati che il file sia un JSON valido.");
                }
            };
            reader.readAsText(file);
        }
    });

    // Apri il modal per aggiungere un nuovo componente
    addBtn.addEventListener('click', function () {
        openEditModal();
    });

    // Inizializza le tabelle
    updateTables();
});