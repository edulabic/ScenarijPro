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


    let pogresnaUloga = function () {
    let uloge = dajUloge();
    let brojPojavljivanja = {};
    
    let tekst = divElement.innerText || divElement.textContent;
    let linije = tekst.split('\n');
    
    for (let linija of linije) {
        let trimmed = linija.trim();
        if (/^[A-ZČĆŽŠĐ\s]+$/.test(trimmed) && /[A-ZČĆŽŠĐ]/.test(trimmed)) {
            if (brojPojavljivanja[trimmed]) {
                brojPojavljivanja[trimmed]++;
            } else {
                brojPojavljivanja[trimmed] = 1;
            }
        }
    }
    
    function razlika(s1, s2) {
        let m = s1.length, n = s2.length;
        let dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (s1[i-1] === s2[j-1]) {
                    dp[i][j] = dp[i-1][j-1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
                }
            }
        }
        return dp[m][n];
    }
    
    let pogresna = [];
    
    for (let i = 0; i < uloge.length; i++) {
        let imeA = uloge[i];
        let brojA = brojPojavljivanja[imeA] || 0;
        
        for (let j = 0; j < uloge.length; j++) {
            if (i === j) continue;
            
            let imeB = uloge[j];
            let brojB = brojPojavljivanja[imeB] || 0;
            
            let duzina = Math.max(imeA.length, imeB.length);
            let razl = razlika(imeA, imeB);
            
            let veomaSlicna = false;
            if (duzina <= 5 && razl <= 1) {
                veomaSlicna = true;
            } else if (duzina > 5 && razl <= 2) {
                veomaSlicna = true;
            }
            if (veomaSlicna && brojB >= 4 && (brojB - brojA) >= 3) {
                if (!pogresna.includes(imeA)) {
                    pogresna.push(imeA);
                }
                break;
            }
        }
    }
    
    return pogresna;
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
        formatirajTekst: formatirajTekst,
        pogresnaUloga: pogresnaUloga
    };
};