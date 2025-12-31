let div = document.getElementById("editor");
let editor = EditorTeksta(div);
div.setAttribute('contenteditable', 'true');
let lastTimestamp = 0;
const SCENARIO_ID = getScenarioId();

function prikaziPoruku(tekst) {
    let porukeDiv = document.getElementById("poruke");
    porukeDiv.innerHTML = `<p>${tekst}</p>`;
}

document.getElementById("boldBtn").addEventListener("click", function() {
    let rezultat = editor.formatirajTekst("bold");

});

document.getElementById("italicBtn").addEventListener("click", function() {
    let rezultat = editor.formatirajTekst("italic");

});

document.getElementById("underlineBtn").addEventListener("click", function() {
    let rezultat = editor.formatirajTekst("underline");
   
});

document.getElementById("brojRijeciBtn").addEventListener("click", function() {
    let rezultat = editor.dajBrojRijeci();
    prikaziPoruku(`Ukupno riječi: ${rezultat.ukupno}, Boldiranih: ${rezultat.boldiranih}, Italic: ${rezultat.italic}`);
});

document.getElementById("ulogeBtn").addEventListener("click", function() {
    let uloge = editor.dajUloge();
    if (uloge.length > 0) {
        prikaziPoruku(`Uloge: ${uloge.join(", ")}`);
    } else {
        prikaziPoruku("Nema pronađenih uloga u tekstu.");
    }
});

document.getElementById("pogresneUlogeBtn").addEventListener("click", function() {
    let pogresne = editor.pogresnaUloga();
    if (pogresne.length > 0) {
        prikaziPoruku(`Potencijalno pogrešne uloge: ${pogresne.join(", ")}`);
    } else {
        prikaziPoruku("Nema potencijalno pogrešnih uloga.");
    }
});

document.getElementById("brojLinijaBtn").addEventListener("click", function() {
    let uloga = document.getElementById("ulogaInput").value.trim();
    if (!uloga) {
        prikaziPoruku("Molimo unesite ime uloge.");
        return;
    }
    let broj = editor.brojLinijaTeksta(uloga);
    prikaziPoruku(`Uloga "${uloga}" ima ${broj} linija teksta.`);
});

document.getElementById("scenarijUlogeBtn").addEventListener("click", function() {
    let uloga = document.getElementById("ulogaInput").value.trim();
    if (!uloga) {
        prikaziPoruku("Molimo unesite ime uloge.");
        return;
    }
    let scenarij = editor.scenarijUloge(uloga);
    if (scenarij.length === 0) {
        prikaziPoruku(`Uloga "${uloga}" ne postoji u scenariju.`);
    } else {
        let html = `<h3>Scenarij za ulogu: ${uloga.toUpperCase()}</h3>`;
        html += `<p>Ukupno replika: ${scenarij.length}</p>`;
        
        scenarij.forEach((stavka, index) => {
            html += `<div style="margin-bottom: 15px; border: 1px solid #ddd; padding: 10px; background: #f9f9f9;">`;
            html += `<strong>Replika ${index + 1}</strong><br>`;
            html += `Scena: ${stavka.scena}<br>`;
            html += `Pozicija u sceni: ${stavka.pozicijaUTekstu}<br><br>`;
            
            if (stavka.prethodni) {
                html += `<em>Prethodni (${stavka.prethodni.uloga}):</em> ${stavka.prethodni.linije.join(' ')}<br>`;
            }
            
            html += `<strong style="color: #007bff;">${stavka.trenutni.uloga}:</strong> ${stavka.trenutni.linije.join(' ')}<br>`;
            
            if (stavka.sljedeci) {
                html += `<em>Sljedeći (${stavka.sljedeci.uloga}):</em> ${stavka.sljedeci.linije.join(' ')}`;
            }
            
            html += `</div>`;
        });
        
        document.getElementById("poruke").innerHTML = html;
    }
});

document.getElementById("grupisiUlogeBtn").addEventListener("click", function() {
    let grupe = editor.grupisiUloge();
    
    if (grupe.length === 0) {
        prikaziPoruku("Nema pronađenih dijalog-segmenata u scenariju.");
        return;
    }
    
    let html = `<h3>Grupisane uloge po dijalog-segmentima</h3>`;
    html += `<p>Ukupno segmenata: ${grupe.length}</p>`;
    
    grupe.forEach((grupa, index) => {
        html += `<div style="margin-bottom: 15px; border: 1px solid #ddd; padding: 10px; background: #f9f9f9;">`;
        html += `<strong>Grupa ${index + 1}</strong><br>`;
        html += `Scena: ${grupa.scena}<br>`;
        html += `Segment u sceni: ${grupa.segment}<br>`;
        html += `Uloge: <span style="color: #007bff; font-weight: bold;">${grupa.uloge.join(", ")}</span>`;
        html += `</div>`;
    });
    
    document.getElementById("poruke").innerHTML = html;
});


function renderScenario(scenario) {
    const editor = document.getElementById("editor");
    editor.innerHTML = "";

    scenario.content.forEach(line => {
        const div = document.createElement("div");
        div.className = "line";
        div.textContent = line.text;
        div.dataset.lineId = line.lineId;
        div.contentEditable = true;

        div.addEventListener("click", () => {
            document.querySelectorAll(".line").forEach(l => l.classList.remove("active-line"));
            div.classList.add("active-line");

            lockLine(div.dataset.lineId);
        });

        div.addEventListener("focus", () => {
            lockLine(div.dataset.lineId);
        });

       let originalText = line.text;

div.addEventListener("blur", () => {
    if (div.textContent !== originalText) {
        updateLine(div.dataset.lineId, div.textContent);
        originalText = div.textContent;
    }
});

        editor.appendChild(div);
    });
}

function lockLine(lineId) {
    const USER_ID = getUserId();
    const SCENARIO_ID = getScenarioId();

    PoziviAjaxFetch.lockLine(
        SCENARIO_ID,
        parseInt(lineId),
        USER_ID,
        (status, data) => {
            const poruke = document.getElementById("poruke");
            const statusDiv = document.getElementById("lockStatus");

            if (status === 200) {
                poruke.textContent = `Linija ${lineId} zaključana`;
                statusDiv.textContent = `Zaključana linija: ${lineId}`;
                statusDiv.style.color = "green";
            } 
            else if (status === 409) {
                poruke.textContent = `Linija ${lineId} je već zaključana`;
                statusDiv.textContent = `Linija ${lineId} je već zaključana`;
                statusDiv.style.color = "orange";
            } 
            else {
                poruke.textContent = data?.message || "Greška";
                statusDiv.textContent = "Greška pri zaključavanju";
                statusDiv.style.color = "red";
            }
        }
    );
}




function updateLine(lineId, text) {
    const USER_ID = getUserId();
    const SCENARIO_ID = getScenarioId();

    PoziviAjaxFetch.updateLine(
        SCENARIO_ID,
        parseInt(lineId),
        USER_ID,
        [text], 
        (status, data) => {
            if (status !== 200) {
                alert(data?.message || "Greška pri snimanju");
            }
        }
    );
}


function applyLineUpdate(delta) {
    const editor = document.getElementById("editor");
    const lines = editor.querySelectorAll(".line");

    lines.forEach(line => {
        if (parseInt(line.dataset.lineId) === delta.lineId) {
            line.textContent = delta.content;
        }
    });
}

function applyCharacterRename(delta) {
    const editor = document.getElementById("editor");

    editor.querySelectorAll(".line").forEach(line => {
        line.textContent = line.textContent.replaceAll(
            delta.oldName,
            delta.newName
        );
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const SCENARIO_ID = getScenarioId();

    PoziviAjaxFetch.getScenario(SCENARIO_ID, (status, data) => {
        if (status !== 200) return;

        renderScenario(data);
    });
});


document.getElementById("renameCharacterBtn").addEventListener("click", () => {
    const oldName = document.getElementById("oldCharacterName").value;
    const newName = document.getElementById("newCharacterName").value;

    if (!oldName || !newName) {
        alert("Unesi oba imena");
        return;
    }

    PoziviAjaxFetch.updateCharacter(
        getScenarioId(),        
        getUserId(),        
        oldName,
        newName,
        (status, data) => {
            if (status === 200) {
                document.getElementById("poruke").textContent =
                    `Lik '${oldName}' preimenovan u '${newName}'`;
            } else {
                alert(data?.message || "Greška pri promjeni imena");
            }
        }
    );
});

let lastDelta = 0;

setInterval(() => {
    PoziviAjaxFetch.getDeltas(
        getScenarioId(),
        lastDelta,
        (status, data) => {
            if (status !== 200 || !data?.deltas) return;

            data.deltas.forEach(delta => {
                if (delta.type === "line_update") {
                    applyLineUpdate(delta);
                }

                if (delta.type === "char_rename") {
                    applyCharacterRename(delta);
                }

                lastDelta = Math.max(lastDelta, delta.timestamp);
            });
        }
    );
}, 3000);


document.getElementById("lockCharacterBtn").addEventListener("click", () => {
    const characterName = document.getElementById("characterName").value;

    if (!characterName) {
        alert("Unesi ime lika");
        return;
    }

    PoziviAjaxFetch.lockCharacter(
        getScenarioId(), 
        characterName,
        getUserId(), 
        (status, data) => {
            if (status === 200) {
                document.getElementById("poruke").textContent =
                    `Lik "${characterName}" zaključan`;
            } else {
                alert(data?.message || "Greška");
            }
        }
    );
});

function getUserId() {
    return parseInt(document.getElementById("userIdInput").value);
}

function getScenarioId() {
    return parseInt(document.getElementById("scenarioIdInput").value);
}

document.getElementById("loadScenarioBtn").addEventListener("click", () => {
    PoziviAjaxFetch.getScenario(
        getScenarioId(),
        (status, data) => {
            if (status === 200) {
                renderScenario(data);
            } else {
                alert("Scenario ne postoji");
            }
        }
    );
});

function showStatus(text) {
    const poruke = document.getElementById("poruke");
    poruke.textContent = text;
}


document.getElementById("createScenarioBtn").addEventListener("click", () => {
    const title = document.getElementById("newScenarioTitle").value.trim();

    if (!title) {
        alert("Unesite naslov scenarija");
        return;
    }

    PoziviAjaxFetch.postScenario(title, (status, data) => {
        if (status === 200 || status === 201) {
            showStatus(`Scenarij "${title}" je kreiran (ID: ${data.id})`);

            document.getElementById("scenarioIdInput").value = data.id;

            renderScenario(data);
        } else {
            alert(data?.message || "Greška pri kreiranju scenarija");
        }
    });
});

