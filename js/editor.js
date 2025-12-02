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