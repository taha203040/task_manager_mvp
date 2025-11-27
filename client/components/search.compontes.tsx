import React, { useState, useRef, useEffect } from "react";

const SearchBox = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Mock suggestions data - replace with actual API call
  const mockSuggestions = [
    "React tutorial",
    "React hooks",
    "React components",
    "JavaScript basics",
    "TypeScript guide",
    "CSS frameworks",
    "Web development",
  ];

  useEffect(() => {
    if (query.length > 0) {
      const filtered = mockSuggestions.filter((item) =>
        item.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div ref={searchBoxRef} className="relative w-full max-w-md">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length > 0 && setShowSuggestions(true)}
        placeholder="Search..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-10">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 flex justify-between py-2 hover:bg-gray-100 cursor-pointer transition-colors duration-150"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}{" "}
              <button className="text-white bg-black p-1 transition-colors rounded">
                Invite
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBox;
