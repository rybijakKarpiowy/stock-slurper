export const getFirstDay = async (company: "Asgard" | "Par" | "Axpol" | "Stricker" | "Maxim") => {
    const fromInput = document.getElementById("from") as HTMLInputElement;
    const toInput = document.getElementById("to") as HTMLInputElement;
    const storage = window.localStorage.getItem(`storage${company}`);

    if (storage) {
        const { firstDay, secondDay } = JSON.parse(storage);
        if (fromInput) {
            fromInput.min = firstDay;
        }
        if (toInput) {
            toInput.min = secondDay;
        }
        return;
    }

    const res = await fetch(
        `https://stock-slurper-production.up.railway.app/firstday?company=${company}`,
        // `http://localhost:5000/firstday?company=${company}`,
        {
            method: "GET",
        }
    );
    const data = await res.json();
    const { firstDay, secondDay } = data;
    if (fromInput) {
        fromInput.min = firstDay;
    }
    if (toInput) {
        toInput.min = secondDay;
    }
    window.localStorage.setItem(`storage${company}`, JSON.stringify({ firstDay, secondDay }));
};
