// Initialise local PouchDB
var db = new PouchDB('local_yugioh_db');

function addCard() {
    var cardName = document.getElementById('card_name').value;
    var cardAtk = parseInt(document.getElementById('card_atk').value);
    var cardDef = parseInt(document.getElementById('card_def').value);
    var cardDesc = document.getElementById('card_desc').value;

    // Input validation:
    if (!cardName || isNaN(cardAtk) || isNaN(cardDef) || !cardDesc) {
        alert("Please fill out all fields correctly.");
        return;
    }
    // Create the card object without _id field. CouchDB should generate it automatically.
    var card = {
        name: cardName,
        atk: cardAtk,
        def: cardDef,
        desc: cardDesc
    };

    db.post(card).then(function (response) {
        console.log('Card added successfully:', response);
        alert('Card added!');
        clearInputFields('add');
    }).catch(function (err) {
        console.log(err);
    });
}

function updateCard() {
    var cardId = document.getElementById('update_card_id').value.trim();
    var cardName = document.getElementById('update_card_name').value.trim();
    var cardAtk = document.getElementById('update_card_atk').value.trim();
    var cardDef = document.getElementById('update_card_def').value.trim();
    var cardDesc = document.getElementById('update_card_desc').value.trim();

    if (!cardId) {
        alert('Card ID is required to update.');
        return;
    }

    if (!cardName) {
        alert('Card name is required.');
        return;
    }

    if (cardAtk === '' || isNaN(cardAtk)) {
        alert('Elease enter a valid number for Attack Points.');
        return;
    }

    if (cardDef === '' || isNaN(cardDef)) {
        alert('Enter a valid number for Defense Points.');
        return;
    }

    if (!cardDesc) {
        alert('Card description is required.');
        return;
    }

    cardAtk = parseInt(cardAtk);
    cardDef = parseInt(cardDef);

    db.get(cardId).then(function (doc) {
        doc.name = cardName;
        doc.atk = cardAtk;
        doc.def = cardDef;
        doc.desc = cardDesc;

        return db.put(doc);
    }).then(function () {
        alert('Card updated successfully!');
        clearInputFields('update');
    }).catch(function (err) {
        if (err.status === 404) {
            alert('Card ID not found. Cannot update a non-existing card.');
        } else {
            console.log(err);
        }
    });
}

function clearInputFields(action) {
    if (action === 'add') {
        document.getElementById('add_card_name').value = '';
        document.getElementById('add_card_atk').value = '';
        document.getElementById('add_card_def').value = '';
        document.getElementById('add_card_desc').value = '';
    } else if (action === 'update') {
        document.getElementById('update_card_id').value = '';
        document.getElementById('update_card_name').value = '';
        document.getElementById('update_card_atk').value = '';
        document.getElementById('update_card_def').value = '';
        document.getElementById('update_card_desc').value = '';
    }
}

function getAllCards() {
    db.allDocs({ include_docs: true }).then(function (result) {
        var output = `<table border="1" style="width:100%; text-align:left;">
                        <tr>
                            <th>Image</th> 
                            <th>Name</th>
                            <th>ID</th>
                            <th>ATK</th>
                            <th>DEF</th>
                            <th>Description</th>
                        </tr>`;
        result.rows.forEach(function (row) {
            // Skip design documents (where _id starts with '_design/')
            if (!row.id.startsWith('_design/')) {
                let imageUrl = row.doc.image_url ? row.doc.image_url : 'https://placehold.co/150x250?text=No+Image'; // Fallback image
                output += `<tr>
                            <td><img src="${imageUrl}" alt="${row.doc.name}" style="width: 150px; height: auto;" loading="lazy"/></td> 
                            <td>${row.doc.name || ''}</td>
                            <td>${row.doc._id}</td>
                            <td>${row.doc.atk || ''}</td>
                            <td>${row.doc.def || ''}</td>
                            <td>${row.doc.desc || ''}</td>
                           </tr>`;
            }
        });
        output += `</table>`;
        document.getElementById('card_list').innerHTML = output;
    }).catch(function (err) {
        console.log(err);
    });
}

function searchCardByName() {
    var searchName = document.getElementById('search_name').value.toLowerCase();

    db.allDocs({ include_docs: true }).then(function (result) {
        var output = `<table border="1" style="width:100%; text-align:left;">
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>ID</th>
                            <th>ATK</th>
                            <th>DEF</th>
                            <th>Description</th>
                        </tr>`;
        var found = false;

        result.rows.forEach(function (row) {
            // Check if 'name' is a valid string and contains the search term
            if (typeof row.doc.name === 'string' && row.doc.name.toLowerCase().includes(searchName)) {
                let imageUrl = row.doc.image_url ? row.doc.image_url : 'https://placehold.co/150x250?text=No+Image'; // Fallback image
                output += `<tr>
                            <td><img src="${imageUrl}" alt="${row.doc.name}" style="width: 150px; height: auto;" loading="lazy" /></td>
                            <td>${row.doc.name || ''}</td>
                            <td>${row.doc._id}</td>
                            <td>${row.doc.atk || ''}</td>
                            <td>${row.doc.def || ''}</td>
                            <td>${row.doc.desc || ''}</td>
                           </tr>`;
                found = true;
            }
        });

        if (found) {
            output += `</table>`;
            document.getElementById('card_list').innerHTML = output;
        } else {
            alert('No cards found!');
            document.getElementById('card_list').innerHTML = '';  // Clear table if no card is found
        }
    }).catch(function (err) {
        console.log(err);
    });
}

function deleteCardByID() {
    var cardId = document.getElementById('delete_card_id').value;

    db.get(cardId).then(function (doc) {
        return db.remove(doc);
    }).then(function () {
        alert('Card deleted successfully!');
    }).catch(function (err) {
        alert('Error deleting card: ' + err);
        console.log(err);
    });
}

function syncWithCouchDB() {
    var remoteCouchDB = new PouchDB('http://admin:password@127.0.0.1:5984/yugioh_cards_db');
    //var remoteCouchDB = new PouchDB('https://apikey-v2-2wxq6v47t1wa8fehju3epoyln49bjq1u5wc23q8x3yhv:db7affcefa8f46faa8e532c281f098a1@3983e07f-425c-4045-8610-187b82996b9b-bluemix.cloudantnosqldb.appdomain.cloud/my_new_database');

    db.sync(remoteCouchDB, {
        live: true,   // Live sync for continuous synchronisation
        retry: true   // Retry in case of connection loss
    }).on('change', function (info) {
        console.log('Sync change:', info);
    }).on('paused', function (err) {
        if (err) {
            console.log('Sync paused due to an error:', err);
        } else {
            console.log('Sync paused, likely waiting for changes or reconnecting.');
        }
    }).on('active', function () {
        console.log('Sync active');
    }).on('denied', function (info) {
        console.log('Sync denied:', info);
    }).on('error', function (err) {
        console.log('Sync error:', err);
    });
}