import React, { useState } from 'react';

const App: React.FC = () => {
    const [scamCases, setScamCases] = useState<string[]>([]);
    const [newCase, setNewCase] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCase) {
            setScamCases([...scamCases, newCase]);
            setNewCase('');
        }
    };

    return (
        <div>
            <h1>Scam Cases</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={newCase}
                    onChange={(e) => setNewCase(e.target.value)}
                    placeholder="Describe the scam case"
                    required
                />
                <button type="submit">Submit Case</button>
            </form>
            <h2>Active Cases</h2>
            <ul>
                {scamCases.map((scamCase, index) => (
                    <li key={index}>{scamCase}</li>
                ))}
            </ul>
        </div>
    );
};

export default App;