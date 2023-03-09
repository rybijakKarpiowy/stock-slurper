import { FormEvent, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
    const [company, setCompany] = useState<"Asgard" | "Axpol" | "Par">();
    const [days, setDays] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleSubmit = async (
        e: FormEvent<HTMLFormElement>,
        company: "Asgard" | "Axpol" | "Par",
        days: number
    ) => {
        e.preventDefault();
        setLoading(true);

        const socket = new WebSocket("wss://stock-slurper-production.up.railway.app");
        // const socket = new WebSocket("ws://localhost:5000");

        socket.onopen = () => {
            console.log("[open] Connected to server by websocket");
            socket.send(JSON.stringify({ company, n: days + 1 }));
        };

        socket.onmessage = (event) => {
            const { message, spreadsheetLink, progress } = JSON.parse(event.data);
            if (message) {
                toast.warn(message);
                setLoading(false);
                return;
            }

            if (progress) {
                console.log(`[progress] ${progress}%`)
                setProgress(parseInt(progress));
                return;
            }

            toast.success("Analiza zakończona pomyślnie!");
            setCompany(undefined);
            setLoading(false);
            setDays(null);
            setProgress(0);
            setTimeout(() => {
                window.location.href = spreadsheetLink;
            }, 500);
            return
        };

        socket.onclose = (event) => {
            if (event.wasClean) {
                console.log(
                    `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
                );
            } else {
                // e.g. server process killed or network down
                // event.code is usually 1006 in this case
                console.log("[close] Connection died");
            }
        };

        socket.onerror = () => {
            console.log(`[error]`);
        };
    };

    return (
        <div className="main">
            <ToastContainer
                position="bottom-center"
                autoClose={3000}
                limit={3}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss={false}
                draggable={false}
                pauseOnHover
                theme="dark"
                style={{ fontSize: "16px" }}
            />
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
                        className={`goback button ${loading && "disabled"}`}
                        type="button"
                        style={{ padding: "0", position: "absolute", left: "0" }}
                        disabled={loading}
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
                        disabled={loading}
                        placeholder="min. 1"
                    />
                    <button
                        className={`submit button ${(!days || loading) && "disabled"} ${loading && "loadingBorder"}`}
                        type="submit"
                        disabled={!days || loading}
                    >
                        {loading ? "Ładowanie..." : "Analizuj"}
                    </button>
                    {loading && <progress value={progress} max="100"></progress>}
                </form>
            ) : (
                <>
                    <h1>Lokomotywy</h1>
                    <span>Wybierz firmę, której dane chcesz przeanalizować</span>
                    <div className="buttons">
                        <button
                            className="button disabled"
                            onClick={() => setCompany("Asgard")}
                            disabled
                        >
                            Asgard
                        </button>
                        <button className="button" onClick={() => setCompany("Axpol")}>
                            Axpol
                        </button>
                        <button className="button" onClick={() => setCompany("Par")}>
                            Par
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default App;
