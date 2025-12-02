let div = document.getElementById("editor");
let editor = EditorTeksta(div);
div.setAttribute('contenteditable', 'true');

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