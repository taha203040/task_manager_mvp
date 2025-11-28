import { api } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

const SearchBox = ({ teamId, userId }: { teamId: string; userId: string }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Seg[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  interface Seg {
    username: string;
    id: string;
    email: string;
  }
  // 🔹 Fetch data from API when query changes
  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await api.get("/members/search", {
          params: { q: query },
          withCredentials: true,
        });
        console.log(res);
        setSuggestions(res.data); // إذا res.data عبارة عن Member[]
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      }
    };

    // 🔹 debounce: تأجيل الاستدعاء 300ms بعد آخر كتابة
    const timeoutId = setTimeout(fetchSuggestions, 300);

    return () => clearTimeout(timeoutId); // تنظيف أي timeout سابق
  }, [query]);

  console.log(query);
  console.log(showSuggestions);
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

  const inviteMutation = useMutation({
    mutationFn: async (data: {
      teamId: string;
      invitedUserId: string;
      role: string;
      invitedBy: string;
    }) => {
      return await api.post("/invites", data, {
        withCredentials: true,
      });
    },

    onSuccess: () => {
      console.log("Invite sent successfully");
      toast.success("invite sended!");
    },

    onError: (error) => {
      console.error("Error sending invite:", error);
      toast.error("invite not sended");
    },
  });

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div ref={searchBoxRef} className="relative w-full max-w-md">
      <input
        type="text"
        // value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length > 0 && setShowSuggestions(true)}
        placeholder="Search..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg transition-transform shadow-lg mt-1 max-h-60 overflow-y-auto z-10">
          {suggestions.map((suggestion: Seg) => (
            <div
              key={suggestion.id}
              className="px-4 flex justify-between py-2 hover:bg-gray-100 cursor-pointer transition-colors duration-150"
              //@ts-ignore
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.username}
              <button
                className="text-white hover:bg-amber-300 hover:text-black bg-black p-1 transition-colors rounded"
                onClick={() =>
                  inviteMutation.mutate({
                    teamId: teamId,
                    invitedUserId: suggestion.id,
                    role: "member",
                    invitedBy: userId,
                  })
                }
              >
                {inviteMutation.isPending ? "Pending..." : "Invite"}{" "}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBox;
