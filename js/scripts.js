// js/scripts.js - Definiert die verfügbaren Lernskripte nach Kategorien

const scriptCategories = [
    {
        categoryTitle: "Mathe Gestaltung Fachoberschule",
        scripts: [
            // Bestehende Skripte...
            {
                folder: "stochastik",
                title: "Stochastik für Gestalter",
                description: "Baumdiagramme, Vierfeldertafeln, Bayes, Binomialverteilung."
            }
        ]
    },
    {
        categoryTitle: "Neue Lektionen (Beispiele)", // Oder eine andere Kategorie
        scripts: [
             {
                folder: "neue-lektion", // Ordnername deiner neuen Lektion
                title: "Neue Lektion: Titel hier", // Titel, der auf der Kachel erscheint
                description: "Eine Beispiel-Lektion mit verschiedenen Aufgabenformaten." // Beschreibung
            }
            // Hier könntest du weitere neue Lektionen hinzufügen
        ]
    },
    {
        categoryTitle: "Allgemeine Beispiele & Demos",
        scripts: [
            // Bestehendes Beispiel...
            {
                folder: "skript-beispiel",
                title: "Beispiel Modul: Interaktive Elemente",
                description: "Eine Demo verschiedener interaktiver Möglichkeiten."
            }
        ]
    }
    // Weitere Kategorien...
];