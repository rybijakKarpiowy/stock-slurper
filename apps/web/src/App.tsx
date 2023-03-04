import { FormEvent, useState } from "react";

function App() {
    const [company, setCompany] = useState<"Asgard" | "Axpol" | "Par">();
    const [days, setDays] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (
        e: FormEvent<HTMLFormElement>,
        company: "Asgard" | "Axpol" | "Par",
        days: number
    ) => {
        e.preventDefault();
        setLoading(true);

        const res = await fetch(
            `https://stock-slurper-production.up.railway.app/?company=${company}&days=${days}`
        );
        
        res.ok
            ? alert("Dane zostały pobrane pomyślnie!")
            : alert("Wystąpił błąd podczas pobierania danych. Spróbuj ponownie później.");

        setLoading(false);
    };

    return (
        <div className="main">
            {company ? (
                <form
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyItems: "center",
                        alignItems: "center",
                        width: "max-content",
                        position: "relative",
                    }}
                    onSubmit={(e) => handleSubmit(e, company, days as number)}
                >
                    <button
                        className="goback"
                        style={{ padding: "0", position: "absolute", left: "0" }}
                        onClick={() => {
                            setCompany(undefined);
                            setDays(null);
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            style={{ width: "24", height: "24" }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                            />
                        </svg>
                    </button>
                    <h1>{company}</h1>
                    <span>Ile dni wziąć pod uwagę podczas analizy?</span>
                    <input
                        type="number"
                        min="1"
                        id="quantity"
                        onChange={(e) => setDays(parseInt((e.target as HTMLInputElement).value))}
                    />
                    <button
                        className={`submit ${!days && "disabled"}`}
                        type="submit"
                        disabled={!days}
                    >
                        Analizuj
                    </button>
                </form>
            ) : (
                <>
                    <h1>Lokomotywy</h1>
                    <span>Wybierz firmę, której dane chcesz przeanalizować</span>
                    <div className="buttons">
                        <button onClick={() => setCompany("Asgard")}>Asgard</button>
                        <button onClick={() => setCompany("Axpol")}>Axpol</button>
                        <button onClick={() => setCompany("Par")}>Par</button>
                    </div>
                </>
            )}
        </div>
    );
}

export default App;
