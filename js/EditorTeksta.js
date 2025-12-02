let EditorTeksta = function (divRef) {
    if (divRef.tagName !== 'DIV') {
        throw new Error("Pogresan tip elementa!");
    }
    
    if (divRef.getAttribute('contenteditable') !== 'true') {
        throw new Error("Neispravan DIV, ne posjeduje contenteditable atribut!");
    }
    
    let divElement = divRef;
    
    let dajBrojRijeci = function () {
    let ukupno = 0;
    let boldiranih = 0;
    let italiciranih = 0;

    let trenutnaRijec = "";
    let boldFlag = true;   
    let italicFlag = true;
    let uRijeci = false;

    function zavrsiRijec() {
        if (!uRijeci) return;
        if (/^[a-zA-ZčČćĆžŽšŠđĐ]+([-''][a-zA-ZčČćĆžŽšŠđĐ]+)*$/.test(trenutnaRijec)) {
            ukupno++;

            if (boldFlag) boldiranih++;
            if (italicFlag) italiciranih++;
        }

        trenutnaRijec = "";
        boldFlag = true;
        italicFlag = true;
        uRijeci = false;
    }

    function obradiNode(node, jeBold, jeItalic) {
        if (node.nodeType === Node.TEXT_NODE) {
            let txt = node.textContent;

            for (let i = 0; i < txt.length; i++) {
                let char = txt[i];

                if (/[a-zA-ZčČćĆžŽšŠđĐ]/.test(char) ||
                    ((char === "-" || char === "'") && uRijeci)) {

                    trenutnaRijec += char;
                    uRijeci = true;

                    if (!jeBold) boldFlag = false;
                    if (!jeItalic) italicFlag = false;

                } else {
                    zavrsiRijec();
                }
            }
        }

        else if (node.nodeType === Node.ELEMENT_NODE) {
            let tag = node.tagName.toLowerCase();

            let noviBold = jeBold || tag === "b" || tag === "strong";
            let noviItalic = jeItalic || tag === "i" || tag === "em";

            for (let child of node.childNodes) {
                obradiNode(child, noviBold, noviItalic);
            }
        }
    }

    obradiNode(divElement, false, false);
    zavrsiRijec(); 

    return {
        ukupno: ukupno,
        boldiranih: boldiranih,
        italic: italiciranih
    };
};

let dajUloge = function () {
    let tekst = divElement.innerText || divElement.textContent;
    let linije = tekst.split('\n');
    let uloge = [];
    let ulogeSet = new Set();

    function jePrazna(linija) {
        return /^\s*$/.test(linija);
    }

    function jeUlogaLinija(linija) {
        let trimmed = linija.trim();

        if (!/[A-ZČĆŽŠĐ]/.test(trimmed)) return false;
        if (!/^[A-ZČĆŽŠĐ\s]+$/.test(trimmed)) return false;

        return true;
    }

    function jeObicanGovor(linija) {
        let trimmed = linija.trim();
        if (jePrazna(trimmed)) return false;
        let jeSveVeliko = /^[A-ZČĆŽŠĐ\s]+$/.test(trimmed);
        return !jeSveVeliko;
    }

    for (let i = 0; i < linije.length; i++) {
        let linija = linije[i];

        if (!jeUlogaLinija(linija)) continue;

        let imaGovor = false;
        for (let j = i + 1; j < linije.length; j++) {
            let sljedeca = linije[j];
            if (jePrazna(sljedeca)) continue;

            if (jeObicanGovor(sljedeca)) {
                imaGovor = true;
            }
            break;
        }

        if (imaGovor) {
            let ime = linija.trim();
            if (!ulogeSet.has(ime)) {
                uloge.push(ime);
                ulogeSet.add(ime);
            }
        }
    }

    return uloge;
};




    
    let formatirajTekst = function(komanda) {
        let selection = window.getSelection();
        
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            return false; 
        }
        
        let range = selection.getRangeAt(0);
        let container = range.commonAncestorContainer;
        let jeUnutarEditora = false;
        
        let trenutniElement = container.nodeType === Node.TEXT_NODE ? 
                              container.parentNode : container;
        
        while (trenutniElement) {
            if (trenutniElement === divElement) {
                jeUnutarEditora = true;
                break;
            }
            trenutniElement = trenutniElement.parentNode;
        }
        
        if (!jeUnutarEditora) {
            return false; 
        }
        
        try {
            document.execCommand(komanda, false, null);
            return true;
        } catch (e) {
            return false;
        }
    };
    
    return {
        dajBrojRijeci: dajBrojRijeci,
        dajUloge: dajUloge,
        formatirajTekst: formatirajTekst
    };
};