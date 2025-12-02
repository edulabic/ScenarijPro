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
        if (/^\(.+\)$/.test(trimmed)) return false;
        let jeSveVeliko = /^[A-ZČĆŽŠĐ\s]+$/.test(trimmed);
        return !jeSveVeliko;
    }

    for (let i = 0; i < linije.length; i++) {
        let linija = linije[i];

        if (!jeUlogaLinija(linija)) continue;
        let imaGovor = false;
        for (let j = i + 1; j < linije.length; j++) {
            let sljedeca = linije[j].trim();
            if (jePrazna(sljedeca)) continue;
            if (/^\(.+\)$/.test(sljedeca)) continue;
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

        let dozvoljene = ['bold', 'italic', 'underline'];
        if (!dozvoljene.includes(komanda)) {
        return false;
        }
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

let brojLinijaTeksta = function(uloga) {
    let ulogaUpper = uloga.toUpperCase();
    let tekst = divElement.innerText || divElement.textContent;
    let linije = tekst.split('\n');
    let ukupnoLinija = 0;
    
    for (let i = 0; i < linije.length; i++) {
        let linija = linije[i].trim();
        
        if (linija === ulogaUpper) {
            for (let j = i + 1; j < linije.length; j++) {
                let govorLinija = linije[j].trim();
                if (govorLinija === '') break;
                if (/^[A-ZČĆŽŠĐ\s]+$/.test(govorLinija) && /[A-ZČĆŽŠĐ]/.test(govorLinija)) break;
                
                if (/^\([^)]*\)$/.test(govorLinija)) {
                    continue; 
                }
                
                ukupnoLinija++;
            }
        }
    }
    
    return ukupnoLinija;
};

let scenarijUloge = function(uloga) {
    let ulogaUpper = uloga.trim().toUpperCase();
    let tekst = divElement.innerText || divElement.textContent;
    let linije = tekst.split('\n');
    let rezultat = [];
    
    function jePrazna(linija) {
        return /^\s*$/.test(linija);
    }
    
    function jeUlogaLinija(linija) {
        let trimmed = linija.trim();
        if (trimmed.length === 0) return false;
        if (!/[A-ZČĆŽŠĐ]/i.test(trimmed)) return false;
        if (!/^[A-ZČĆŽŠĐ\s]+$/.test(trimmed)) return false;
        return true;
    }
    
    function jeNaslovScene(linija) {
        let trimmed = linija.trim();
        if (!/^(INT\.|EXT\.)/.test(trimmed)) return false;
        if (!/-\s*(DAY|NIGHT|AFTERNOON|MORNING|EVENING)\s*$/i.test(trimmed)) return false;
        return true;
    }
    
    function jeLinijaUZagradama(linija) {
        let trimmed = linija.trim();
        return /^\([^)]*\)$/.test(trimmed);
    }
    
    function jeGovorLinija(linija) {
        let trimmed = linija.trim();
        if (jePrazna(trimmed)) return false;
        if (jeUlogaLinija(trimmed)) return false;
        if (jeNaslovScene(trimmed)) return false;
        if (jeLinijaUZagradama(trimmed)) return false;
        return trimmed.length > 0;
    }

    let struktura = [];
    let trenutnaScena = "";
    let i = 0;
    
    while (i < linije.length) {
        let linija = linije[i];
        let trimmed = linija.trim();
        
        if (jePrazna(trimmed)) {
            i++;
            continue;
        }
        
        if (jeNaslovScene(trimmed)) {
            trenutnaScena = trimmed;
            i++;
            continue;
        }
        
        if (jeUlogaLinija(trimmed)) {
            let imeUloge = trimmed.toUpperCase();
            let govorLinije = [];
            let j = i + 1;
            
            while (j < linije.length) {
                let govorLinija = linije[j];
                let govorTrimmed = govorLinija.trim();
                
                if (jePrazna(govorTrimmed)) {
                    j++;
                    break;
                }
                if (jeUlogaLinija(govorTrimmed)) {
                    break;
                }
                
                if (jeNaslovScene(govorTrimmed)) {
                    break;
                }
                
                if (jeLinijaUZagradama(govorTrimmed)) {
                    j++;
                    continue;
                }
                
                if (jeGovorLinija(govorTrimmed)) {
                    govorLinije.push(govorTrimmed);
                    j++;
                } else {
                    break;
                }
            }
            
            if (govorLinije.length > 0) {
                struktura.push({
                    tip: 'replika',
                    uloga: imeUloge,
                    linije: govorLinije,
                    scena: trenutnaScena,
                    indeks: i
                });
            }
            
            i = j;
            continue;
        }
        
        struktura.push({
            tip: 'akcija',
            indeks: i
        });
        
        i++;
    }
    
    for (let idx = 0; idx < struktura.length; idx++) {
        let stavka = struktura[idx];
        
        if (stavka.tip !== 'replika') continue;
        if (stavka.uloga !== ulogaUpper) continue;
        
        let prethodni = null;
        for (let p = idx - 1; p >= 0; p--) {
            if (struktura[p].tip === 'akcija') break;
            if (struktura[p].scena !== stavka.scena) break;
            if (struktura[p].tip === 'replika') {
                prethodni = {
                    uloga: struktura[p].uloga,
                    linije: struktura[p].linije
                };
                break;
            }
        }
        
        let sljedeci = null;
        for (let s = idx + 1; s < struktura.length; s++) {
            if (struktura[s].tip === 'akcija') break;
            if (struktura[s].scena !== stavka.scena) break;
            if (struktura[s].tip === 'replika') {
                sljedeci = {
                    uloga: struktura[s].uloga,
                    linije: struktura[s].linije
                };
                break;
            }
        }
        
        let pozicijaUTekstu = 1;
        for (let p = 0; p < idx; p++) {
            if (struktura[p].tip === 'replika' && struktura[p].scena === stavka.scena) {
                pozicijaUTekstu++;
            }
        }
        
        rezultat.push({
            scena: stavka.scena,
            pozicijaUTekstu: pozicijaUTekstu,
            prethodni: prethodni,
            trenutni: {
                uloga: stavka.uloga,
                linije: stavka.linije
            },
            sljedeci: sljedeci
        });
    }
    
    return rezultat;
};
   let grupisiUloge = function () {
    let tekst = divElement.innerText || divElement.textContent;
    let linije = tekst.split('\n');

    function jePrazna(linija) {
        return /^\s*$/.test(linija);
    }
    function jeUlogaLinija(linija) {
        let t = linija.trim();
        if (!/^[A-ZČĆŽŠĐ\s]+$/.test(t)) return false;
        if (/^AKCIJA\b/.test(t)) return false;
        return true;
    }

    function jeAkcija(linija) {
        return /^AKCIJA\b/.test(linija.trim());
    }

    function jeNaslovScene(linija) {
        let t = linija.trim();
        return /^(INT\.|EXT\.)/.test(t);
    }

    function jeLinijaUZagradama(linija) {
        return /^\([^)]*\)$/.test(linija.trim());
    }

    function jeGovorLinija(linija) {
        let t = linija.trim();
        if (jePrazna(t)) return false;
        if (jeNaslovScene(t)) return false;
        if (jeUlogaLinija(t)) return false;
        if (jeLinijaUZagradama(t)) return false;
        if (jeAkcija(t)) return false;
        return true;
    }
    let struktura = [];
    let trenutnaScena = "";

    for (let i = 0; i < linije.length; i++) {
        let linija = linije[i].trim();
        if (jePrazna(linija)) continue;

        if (jeNaslovScene(linija)) {
            trenutnaScena = linija;
            struktura.push({ tip: "naslov_scene", scena: trenutnaScena });
            continue;
        }
        if (jeAkcija(linija)) {
            struktura.push({ tip: "akcija", scena: trenutnaScena });
            continue;
        }

        if (jeUlogaLinija(linija)) {
            let ime = linija.trim();
            let govor = [];
            let j = i + 1;

            while (j < linije.length) {
                let gl = linije[j].trim();

                if (jePrazna(gl)) {
                    j++;
                    break;
                }
                if (jeNaslovScene(gl) || jeUlogaLinija(gl) || jeAkcija(gl)) break;
                if (jeLinijaUZagradama(gl)) { j++; continue; }

                if (jeGovorLinija(gl)) {
                    govor.push(gl);
                    j++;
                } else break;
            }

            if (govor.length > 0) {
                struktura.push({
                    tip: "replika",
                    uloga: ime,
                    scena: trenutnaScena
                });
            }

            i = j - 1;
            continue;
        }
    }
    let rezultat = [];
    let segment = null;
    let brojacPoSceni = {};

    for (let item of struktura) {

        if (item.tip === "naslov_scene") {
            if (segment && segment.uloge.length > 0) rezultat.push(segment);
            segment = null;
            continue;
        }

        if (item.tip === "akcija") {
            if (segment && segment.uloge.length > 0) rezultat.push(segment);
            segment = null;
            continue;
        }
        if (item.tip === "replika") {
            if (!segment || segment.scena !== item.scena) {
                if (segment && segment.uloge.length > 0) rezultat.push(segment);
                if (!brojacPoSceni[item.scena]) brojacPoSceni[item.scena] = 0;
                brojacPoSceni[item.scena]++;

                segment = {
                    scena: item.scena,
                    segment: brojacPoSceni[item.scena],
                    uloge: []
                };
            }
            if (!segment.uloge.includes(item.uloga))
                segment.uloge.push(item.uloga);
        }
    }
    if (segment && segment.uloge.length > 0) rezultat.push(segment);

    return rezultat;
};

    return {
        dajBrojRijeci: dajBrojRijeci,
        dajUloge: dajUloge,
        formatirajTekst: formatirajTekst,
        pogresnaUloga: pogresnaUloga,
        brojLinijaTeksta: brojLinijaTeksta,    
        scenarijUloge: scenarijUloge,
        grupisiUloge: grupisiUloge 
    };
};