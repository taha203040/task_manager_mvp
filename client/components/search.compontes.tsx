import { api } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

const SearchBox = ({ teamId, userId }: { teamId: string; userId: string }) => {
 interface Suggestion {
  id: string;
  username: string;
  email: string;
  inviteStatus: string | null;
}

const [query, setQuery] = useState("");
const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
const [showSuggestions, setShowSuggestions] = useState(false);

useEffect(() => {
  if (!query.trim()) {
    setSuggestions([]);
    setShowSuggestions(false);
    return;
  }

  const fetchSuggestions = async () => {
    try {
      const res = await api.get("/members/search", {
        params: {
          q: query.trim(),
          // teamId,
        },
        withCredentials: true,
      });
      console.log('ress',res)
      setSuggestions(res.data);
      setShowSuggestions(true);
    } catch (error) {
      console.log({err:error})
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const timeoutId = setTimeout(fetchSuggestions, 1000);

  return () => clearTimeout(timeoutId);
}, [query, teamId]);
  console.log(query);
  console.log(showSuggestions);
  const searchBoxRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;

    if (
      searchBoxRef.current &&
      !searchBoxRef.current.contains(target)
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
<div ref={searchBoxRef} className="relative">
  <input
    type="text"
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    onFocus={() => {
      if (suggestions.length > 0) {
        setShowSuggestions(true);
      }
    }}
  />

  {showSuggestions && suggestions.length > 0 && (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-10">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className="px-4 flex justify-between py-2 hover:bg-gray-100 cursor-pointer transition-colors duration-150"
          onClick={() => handleSuggestionClick(suggestion.username)}
        >
          <div className="flex flex-col">
            <span>{suggestion.username}</span>

            <span className="text-xs text-gray-500">
              {suggestion.email}
            </span>
          </div>

          <button
            type="button"
            className={`px-3 py-1 rounded transition-colors ${
              suggestion.inviteStatus === "pending"
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-black text-white hover:bg-amber-300 hover:text-black"
            }`}
            onClick={(e) => {
              e.stopPropagation();

              if (suggestion.inviteStatus !== "pending") {
                inviteMutation.mutate({
                  teamId,
                  invitedUserId: suggestion.id,
                  role: "member",
                  invitedBy: userId,
                });
              }
            }}
            disabled={
              suggestion.inviteStatus === "pending" ||
              inviteMutation.isPending
            }
          >
            {suggestion.inviteStatus === "pending"
              ? "Invited"
              : inviteMutation.isPending
              ? "Sending..."
              : "Invite"}
          </button>
        </div>
      ))}
    </div>
  )}
</div>
  );
};

export default SearchBox;
