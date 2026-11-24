"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { LeaderboardRow, ProfileRow } from "@/lib/supabase/database.types";

type View = "home" | "worlds" | "leaderboard" | "achievements" | "shop" | "hall-of-fame";
type Player = {
  username: string;
  avatar: string;
  xp: number;
  coins: number;
  completed: number;
  streak: number;
  lastClaim: string;
  hearts: number;
  heartRefillAt: number | null;
  campaignCompletedAt: string | null;
};

const STORAGE_KEY = "code-escape-master-player-v1";
const INTRO_KEY = "code-escape-master-intro-seen";
const MAX_HEARTS = 3;
const HEART_REFILL_MS = 10 * 60 * 1000;
const HEART_REFILL_COST = 50;
const initialPlayer: Player = {
  username: "Rookie",
  avatar: "🧗",
  xp: 0,
  coins: 120,
  completed: 0,
  streak: 1,
  lastClaim: "",
  hearts: MAX_HEARTS,
  heartRefillAt: null,
  campaignCompletedAt: null,
};

const navItems: { id: View; label: string; icon: string }[] = [
  { id: "home", label: "Trail camp", icon: "⌂" },
  { id: "worlds", label: "Explore worlds", icon: "♧" },
  { id: "leaderboard", label: "Leaderboard", icon: "♧" },
  { id: "achievements", label: "Achievements", icon: "✧" },
  { id: "shop", label: "Trail gear", icon: "◇" },
  { id: "hall-of-fame", label: "Hall of Fame", icon: "♛" },
];

const worlds = [
  { name: "Canopy Crossing", start: 1, end: 10, range: "LEVELS 01 — 10", color: "mint", icon: "♧" },
  { name: "Logic Lagoon", start: 11, end: 25, range: "LEVELS 11 — 25", color: "blue", icon: "⌁" },
  { name: "Mosslight Forest", start: 26, end: 45, range: "LEVELS 26 — 45", color: "violet", icon: "♧" },
  { name: "Temple Run", start: 46, end: 75, range: "LEVELS 46 — 75", color: "orange", icon: "⚡" },
  { name: "The Lost Canopy", start: 76, end: 100, range: "LEVELS 76 — 100", color: "pink", icon: "✦" },
];

const challengeBank = [
  {
    topic: "FUNCTIONS · LEVEL 1",
    title: "A little bonus logic.",
    description: "The trail guide measures a vine’s strength in two parts. Combine both readings to make sure the forest bridge is safe.",
    codeBefore: "function vineStrength(base, bonus) {\n  // combine both readings\n  ",
    codeAfter: "\n}\n\nconst strength = vineStrength(7, 3);\nconsole.log(strength); // expected: 10",
    options: ["return base + bonus;", "return base - bonus;", "return base * bonus;", "return base;"],
    answer: "return base + bonus;",
    hint: "The + operator adds two numbers together.",
  },
  {
    topic: "STRINGS · LEVEL 2",
    title: "A proper hello.",
    description: "Give Ari a warm welcome. The greeting should read “Hello, Ari!” including the comma and exclamation mark.",
    codeBefore: 'function greet(name) {\n  ',
    codeAfter: '\n}\n\nconsole.log(greet("Ari")); // Hello, Ari!',
    options: ['return "Hello, " + name + "!";', 'return "Hello, " + name;', 'return name + "Hello!";', 'return "Hello, Ari!";'],
    answer: 'return "Hello, " + name + "!";',
    hint: "Join the greeting, the name, and the punctuation into one string.",
  },
  {
    topic: "ARITHMETIC · LEVEL 3",
    title: "Square up.",
    description: "A forest ranger needs the area of a square clearing. Multiply a side by itself to plan the campsite.",
    codeBefore: "function square(side) {\n  ",
    codeAfter: "\n}\n\nconsole.log(square(4)); // expected: 16",
    options: ["return side * side;", "return side + side;", "return side * 2;", "return side / side;"],
    answer: "return side * side;",
    hint: "An area uses the side multiplied by itself.",
  },
  {
    topic: "ARRAYS · LEVEL 4",
    title: "Pick the right signal.",
    description: "Signals are stored in an array. Return the second signal, which has the value “green”.",
    codeBefore: 'const signals = ["red", "green", "blue"];\nfunction secondSignal() {\n  ',
    codeAfter: '\n}\n\nconsole.log(secondSignal()); // green',
    options: ["return signals[1];", "return signals[2];", "return signals[0];", "return signals.length;"],
    answer: "return signals[1];",
    hint: "Array positions start at zero, so the second item is at index 1.",
  },
  {
    topic: "CONDITIONALS · LEVEL 5",
    title: "Cross the river.",
    description: "The stepping stones are safe when the water is 50 cm deep or less. Return true when the river is safe to cross.",
    codeBefore: "function riverIsSafe(depth) {\n  ",
    codeAfter: "\n}\n\nconsole.log(riverIsSafe(50)); // expected: true",
    options: ["return depth <= 50;", "return depth < 50;", "return depth = 50;", "return depth > 50;"],
    answer: "return depth <= 50;",
    hint: "Use <= to include the safe depth and anything below it.",
  },
  {
    topic: "BOOLEAN LOGIC · LEVEL 6",
    title: "Spot an even number.",
    description: "A trail marker glows for even-numbered trees. Return true when the tree number divides evenly by two.",
    codeBefore: "function isEven(number) {\n  ",
    codeAfter: "\n}\n\nconsole.log(isEven(8)); // expected: true",
    options: ["return number % 2 === 0;", "return number / 2 === 0;", "return number % 2 === 1;", "return number === 2;"],
    answer: "return number % 2 === 0;",
    hint: "The remainder operator (%) is zero when a number divides evenly.",
  },
  {
    topic: "LOOPS · LEVEL 7",
    title: "Count the fireflies.",
    description: "A jar starts empty and three fireflies are blinking nearby. Add one to your count for every firefly.",
    codeBefore: "let pulses = 0;\nfor (let i = 0; i < 3; i++) {\n  ",
    codeAfter: "\n}\nconsole.log(pulses); // expected: 3",
    options: ["pulses += 1;", "pulses = i;", "pulses -= 1;", "i += pulses;"],
    answer: "pulses += 1;",
    hint: "Increase the pulse counter by one on every loop iteration.",
  },
  {
    topic: "OBJECTS · LEVEL 8",
    title: "Find the trail guide.",
    description: "The ranger’s field notes store their name in a profile. Read the name property to identify who marked the trail.",
    codeBefore: 'const guide = { name: "Rae", role: "ranger" };\nfunction trailGuide() {\n  ',
    codeAfter: '\n}\n\nconsole.log(trailGuide()); // Rae',
    options: ["return guide.name;", "return guide[0];", "return guide.role;", "return name.guide;"],
    answer: "return guide.name;",
    hint: "Read a named object property with dot notation: object.property.",
  },
  {
    topic: "ARRAY METHODS · LEVEL 9",
    title: "Count the supplies.",
    description: "A trail pack holds four supplies. Read the array’s length to get the total without counting by hand.",
    codeBefore: "const supplies = [\"water\", \"food\", \"medkit\", \"fuel\"];\nfunction packCount() {\n  ",
    codeAfter: '\n}\n\nconsole.log(packCount()); // expected: 4',
    options: ["return supplies.length;", "return supplies[4];", "return supplies.size;", "return supplies + 1;"],
    answer: "return supplies.length;",
    hint: "Arrays have a length property that tells you how many items they contain.",
  },
  {
    topic: "FUNCTIONS · LEVEL 10",
    title: "Gather the herbs.",
    description: "A ranger is weighing gathered herbs. Loop through each bundle and add its weight to the running total.",
    codeBefore: "function totalWeight(weights) {\n  let total = 0;\n  for (const weight of weights) {\n    ",
    codeAfter: "\n  }\n  return total;\n}\n\nconsole.log(totalWeight([2, 3])); // expected: 5",
    options: ["total += weight;", "total = weight;", "weight += 1;", "total -= weight;"],
    answer: "total += weight;",
    hint: "Add each current weight to the total as the loop visits it.",
  },
  {
    topic: "ARRAYS · LEVEL 11",
    title: "Find the tallest tree.",
    description: "The ranger’s map stores tree heights in meters. Return the tallest height so the crew can mark the canopy route.",
    codeBefore: "function tallestTree(heights) {\n  ",
    codeAfter: '\n}\n\nconsole.log(tallestTree([8, 14, 11])); // 14',
    options: ["return Math.max(...heights);", "return Math.min(...heights);", "return heights[0];", "return heights.length;"],
    answer: "return Math.max(...heights);",
    hint: "Spread the values into Math.max to compare every height.",
  },
  {
    topic: "ARRAY METHODS · LEVEL 12",
    title: "Pack only the ripe berries.",
    description: "Keep only berries marked ripe. The filter callback should return true for each ripe berry.",
    codeBefore: 'const berries = [{ ripe: true }, { ripe: false }];\nconst ripeBerries = berries.filter((berry) => ',
    codeAfter: "\n);",
    options: ["berry.ripe", "!berry.ripe", "berries.ripe", "berry === true"],
    answer: "berry.ripe",
    hint: "The callback receives one berry at a time; check its ripe property.",
  },
  {
    topic: "LOOPS · LEVEL 13",
    title: "Count the trail markers.",
    description: "Count each marker from one through four. The loop condition must include marker four.",
    codeBefore: "let markers = 0;\nfor (let i = 1; ",
    codeAfter: " i++) {\n  markers++;\n}",
    options: ["i <= 4;", "i < 4;", "i === 4;", "i > 4;"],
    answer: "i <= 4;",
    hint: "Use <= so the loop includes its final marker, number four.",
  },
  {
    topic: "OBJECTS · LEVEL 14",
    title: "Read the explorer’s call sign.",
    description: "A trail pass stores the explorer’s call sign. Use bracket notation to read a property from a variable key.",
    codeBefore: 'const pass = { callSign: "Cedar" };\nconst key = "callSign";\n',
    codeAfter: "\nconsole.log(name); // Cedar",
    options: ["const name = pass[key];", "const name = pass.key;", "const name = key.pass;", "const name = pass[0];"],
    answer: "const name = pass[key];",
    hint: "A variable property key goes inside square brackets.",
  },
  {
    topic: "STRINGS · LEVEL 15",
    title: "Leave a trail note.",
    description: "Build a sign that says “North ridge” using a template literal and the direction variable.",
    codeBefore: 'const direction = "North";\nconst sign = ',
    codeAfter: ";",
    options: ['`${direction} ridge`', '"${direction} ridge"', "direction + ridge", "`direction ridge`"],
    answer: "`${direction} ridge`",
    hint: "Template literals use backticks and wrap interpolated variables in ${...}.",
  },
  {
    topic: "ARRAY METHODS · LEVEL 16",
    title: "Find the river crossing.",
    description: "Find the first crossing whose name is Riverbend. Return the crossing object, not its position.",
    codeBefore: 'const crossings = [{ name: "Pine" }, { name: "Riverbend" }];\nconst route = crossings.',
    codeAfter: '((crossing) => crossing.name === "Riverbend");',
    options: ["find", "filter", "map", "forEach"],
    answer: "find",
    hint: "find returns the first matching item; filter returns an array of all matches.",
  },
  {
    topic: "CONDITIONALS · LEVEL 17",
    title: "Check the weather warning.",
    description: "The lookout should raise a warning only when rain is heavy and wind is strong.",
    codeBefore: "function raiseWarning(heavyRain, strongWind) {\n  return ",
    codeAfter: ";\n}",
    options: ["heavyRain && strongWind", "heavyRain || strongWind", "!heavyRain && strongWind", "heavyRain === strongWind"],
    answer: "heavyRain && strongWind",
    hint: "Both conditions must be true, so join them with the logical AND operator.",
  },
  {
    topic: "ARROW FUNCTIONS · LEVEL 18",
    title: "Convert steps to meters.",
    description: "Each trail step covers three meters. Finish the arrow function so it returns the converted distance.",
    codeBefore: "const toMeters = (steps) => ",
    codeAfter: ";\nconsole.log(toMeters(5)); // 15",
    options: ["steps * 3", "steps + 3", "steps / 3", "3 - steps"],
    answer: "steps * 3",
    hint: "Multiply the number of steps by three meters per step.",
  },
  {
    topic: "SETS · LEVEL 19",
    title: "Remove duplicate footprints.",
    description: "Several explorers walked the same route. Create a Set from the list to keep only unique trail markers.",
    codeBefore: 'const markers = ["Pine", "Pine", "Creek"];\nconst uniqueMarkers = ',
    codeAfter: ";\nconsole.log(uniqueMarkers.size); // 2",
    options: ["new Set(markers)", "Set(markers)", "markers.unique()", "new Array(markers)"],
    answer: "new Set(markers)",
    hint: "Construct a Set with new Set(iterable) to deduplicate its values.",
  },
  {
    topic: "ERROR HANDLING · LEVEL 20",
    title: "Keep the expedition safe.",
    description: "The map service may fail. Catch the error so the crew can show a friendly fallback instead of crashing.",
    codeBefore: "try {\n  loadTrailMap();\n",
    codeAfter: ' (error) {\n  console.log("Map unavailable");\n}',
    options: ["} catch", "} finally", "} else", "} throw"],
    answer: "} catch",
    hint: "A catch block handles an error thrown by the preceding try block.",
  },
];

function Icon({ children }: { children: string }) {
  return <span className="nav-icon" aria-hidden="true">{children}</span>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand${compact ? " brand-compact" : ""}`}>
      <span className="brand-mark"><span>⌘</span></span>
      {!compact && (
        <span className="brand-name">CODE ESCAPE<span className="brand-sub">MASTER</span></span>
      )}
    </div>
  );
}

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function playerFromProfile(profile: ProfileRow): Player {
  const refillTime = profile.heart_refill_at ? new Date(profile.heart_refill_at).getTime() : null;
  const completedAt = profile.campaign_completed_at && Number.isFinite(new Date(profile.campaign_completed_at).getTime())
    ? profile.campaign_completed_at
    : null;

  return {
    username: profile.username,
    avatar: profile.avatar,
    xp: profile.xp,
    coins: profile.coins,
    completed: profile.completed,
    streak: profile.streak,
    lastClaim: profile.last_claim,
    hearts: profile.hearts,
    heartRefillAt: refillTime !== null && Number.isFinite(refillTime) ? refillTime : null,
    campaignCompletedAt: completedAt,
  };
}

function profileFromPlayer(userId: string, player: Player) {
  return {
    id: userId,
    username: player.username,
    avatar: player.avatar,
    xp: player.xp,
    coins: player.coins,
    completed: player.completed,
    streak: player.streak,
    last_claim: player.lastClaim,
    hearts: player.hearts,
    heart_refill_at: player.heartRefillAt === null ? null : new Date(player.heartRefillAt).toISOString(),
    campaign_completed_at: player.campaignCompletedAt,
  };
}

export default function Home() {
  const [player, setPlayer] = useState(initialPlayer);
  const [view, setView] = useState<View>("home");
  const [ready, setReady] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [today, setToday] = useState("");
  const [clockNow, setClockNow] = useState(0);
  const [dateLabel, setDateLabel] = useState("");
  const [banner, setBanner] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeLevel, setChallengeLevel] = useState<number | null>(null);
  const [campaignAttempt, setCampaignAttempt] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answerResult, setAnswerResult] = useState<"correct" | "incorrect" | "">("");
  const [rewardCelebration, setRewardCelebration] = useState(false);
  const [toast, setToast] = useState("");
  const [levelUp, setLevelUp] = useState<{ previous: number; current: number } | null>(null);
  const [coachSpeaking, setCoachSpeaking] = useState(false);
  const [briefingExpanded, setBriefingExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(!isSupabaseConfigured);
  const [authOpen, setAuthOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [cloudReadyFor, setCloudReadyFor] = useState<string | null>(null);
  const [profileState, setProfileState] = useState<"idle" | "loading" | "username" | "ready" | "error">("idle");
  const [profileRetry, setProfileRetry] = useState(0);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState("");
  const playerSnapshot = useRef(player);
  const [leaderboardRows, setLeaderboardRows] = useState<LeaderboardRow[]>([]);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(false);
  const [leaderboardRetry, setLeaderboardRetry] = useState(0);

  useEffect(() => {
    playerSnapshot.current = player;
  }, [player]);

  useEffect(() => {
    if (!challengeOpen && !authOpen && !rewardCelebration && !levelUp) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [challengeOpen, authOpen, rewardCelebration, levelUp]);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error("Could not restore the Supabase session.", error);
        setBanner("Unable to restore your account session. Try signing in again.");
      }
      setAuthUser(data.session?.user ?? null);
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setAuthUser(user);
      setAuthChecked(true);
      setCloudReadyFor(null);
      setProfileState(user ? "loading" : "idle");
      if (user) {
        setAuthOpen(false);
        setShowIntro(false);
      } else {
        setShowIntro(true);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadTimeout = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        setShowIntro(window.localStorage.getItem(INTRO_KEY) !== "true");
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<Player>;
          setPlayer({
            username: typeof parsed.username === "string" ? parsed.username.slice(0, 18) : initialPlayer.username,
            avatar: typeof parsed.avatar === "string" ? parsed.avatar : initialPlayer.avatar,
            xp: Number.isFinite(parsed.xp) ? Math.max(0, parsed.xp as number) : initialPlayer.xp,
            coins: Number.isFinite(parsed.coins) ? Math.max(0, parsed.coins as number) : initialPlayer.coins,
            completed: Number.isFinite(parsed.completed) ? Math.min(100, Math.max(0, Math.floor(parsed.completed as number))) : initialPlayer.completed,
            streak: Number.isFinite(parsed.streak) ? Math.max(1, Math.floor(parsed.streak as number)) : initialPlayer.streak,
            lastClaim: typeof parsed.lastClaim === "string" ? parsed.lastClaim : initialPlayer.lastClaim,
            hearts: Number.isFinite(parsed.hearts) ? Math.min(MAX_HEARTS, Math.max(0, Math.floor(parsed.hearts as number))) : initialPlayer.hearts,
            heartRefillAt: Number.isFinite(parsed.heartRefillAt)
              ? Math.max(0, parsed.heartRefillAt as number)
              : parsed.hearts === 0 ? Date.now() + HEART_REFILL_MS : initialPlayer.heartRefillAt,
            campaignCompletedAt: typeof parsed.campaignCompletedAt === "string" ? parsed.campaignCompletedAt : initialPlayer.campaignCompletedAt,
          });
        }
      } catch {
        setBanner("We couldn’t restore your saved progress. You can keep playing in this session.");
      } finally {
        const now = new Date();
        setToday(now.toDateString());
        setDateLabel(new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(now).toUpperCase());
        setIsOnline(window.navigator.onLine);
        setReady(true);
      }
    }, 0);

    const updateConnection = () => setIsOnline(window.navigator.onLine);
    const handleStorageError = () => setBanner("Your browser couldn’t save progress. Free up storage space and try again.");
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    window.addEventListener("game-storage-error", handleStorageError);
    return () => {
      window.clearTimeout(loadTimeout);
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
      window.removeEventListener("game-storage-error", handleStorageError);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
    } catch {
      window.dispatchEvent(new Event("game-storage-error"));
    }
  }, [player, ready]);

  useEffect(() => {
    if (!ready) return;
    if (!authUser || !supabase) {
      return;
    }

    const client = supabase;
    let active = true;
    const loadProfile = async () => {
      const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!active) return;
      if (error) {
        console.error("Could not load the cloud profile.", error);
        setProfileState("error");
        return;
      }

      if (data) {
        setPlayer(playerFromProfile(data));
        setCloudReadyFor(authUser.id);
        setProfileState("ready");
        setShowIntro(false);
      } else {
        setUsernameInput("");
        setUsernameMessage("");
        setProfileState("username");
        setShowIntro(false);
      }
    };

    void loadProfile();
    return () => {
      active = false;
    };
  }, [ready, authUser, profileRetry]);

  useEffect(() => {
    if (!ready || !authUser || !supabase || cloudReadyFor !== authUser.id) return;

    const client = supabase;
    const timeout = window.setTimeout(() => {
      void client
        .from("profiles")
        .upsert(profileFromPlayer(authUser.id, player), { onConflict: "id" })
        .then(({ error }) => {
          if (error) {
            console.error("Could not save cloud progress.", error);
            setBanner("Unable to sync your progress. Your local save is safe.");
          }
        });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [player, ready, authUser, cloudReadyFor]);

  useEffect(() => {
    if (view !== "leaderboard" || !supabase) return;

    const client = supabase;
    let active = true;
    void client
      .from("leaderboard")
      .select("username, avatar, xp, completed, updated_at")
      .order("xp", { ascending: false })
      .order("completed", { ascending: false })
      .limit(25)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Could not load the leaderboard.", error);
          setLeaderboardError(true);
          setLeaderboardRows([]);
        } else {
          setLeaderboardRows(data ?? []);
        }
        setLeaderboardLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [view, leaderboardRetry]);

  useEffect(() => {
    if (!ready) return;
    const updateHearts = () => {
      const now = Date.now();
      setClockNow(now);
      setPlayer((previous) => {
        if (previous.hearts >= MAX_HEARTS || previous.heartRefillAt === null || previous.heartRefillAt > now) return previous;
        const recoveredHearts = Math.min(
          MAX_HEARTS - previous.hearts,
          1 + Math.floor((now - previous.heartRefillAt) / HEART_REFILL_MS),
        );
        const hearts = previous.hearts + recoveredHearts;
        return {
          ...previous,
          hearts,
          heartRefillAt: hearts >= MAX_HEARTS ? null : previous.heartRefillAt + recoveredHearts * HEART_REFILL_MS,
        };
      });
    };
    updateHearts();
    const interval = window.setInterval(updateHearts, 1000);
    return () => window.clearInterval(interval);
  }, [ready]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!rewardCelebration) return;
    const timeout = window.setTimeout(() => setRewardCelebration(false), 3200);
    return () => window.clearTimeout(timeout);
  }, [rewardCelebration]);

  const currentLevel = Math.min(player.completed + 1, 100);
  const playerLevel = Math.floor(player.xp / 500) + 1;
  const progressPercent = Math.min(Math.round((player.completed / 100) * 100), 100);
  const claimedToday = today !== "" && player.lastClaim === today;
  const activeWorldIndex = Math.max(0, worlds.findIndex((world) => currentLevel >= world.start && currentLevel <= world.end));
  const activeWorld = worlds[activeWorldIndex];
  const completedInWorld = Math.min(activeWorld.end - activeWorld.start + 1, Math.max(0, player.completed - activeWorld.start + 1));
  const levelSegmentStart = activeWorld.start + Math.floor((currentLevel - activeWorld.start) / 10) * 10;
  const visibleLevels = Array.from({ length: Math.min(10, activeWorld.end - levelSegmentStart + 1) }, (_, index) => levelSegmentStart + index);
  const levelProgress = visibleLevels.length > 1 ? Math.min((currentLevel - levelSegmentStart) / (visibleLevels.length - 1) * 100, 100) : 0;
  const activeChallengeLevel = challengeLevel ?? currentLevel;
  const challengeWorldIndex = Math.max(0, worlds.findIndex((world) => activeChallengeLevel >= world.start && activeChallengeLevel <= world.end));
  const currentChallenge = challengeBank[(activeChallengeLevel - 1) % challengeBank.length];
  const coachLine = `${currentChallenge.description} Take a breath, read the code, then make your move.`;
  const avatar = player.avatar;

  function beginAdventure() {
    if (isSupabaseConfigured && !authUser) {
      setAuthMessage("");
      setAuthOpen(true);
      return;
    }
    try {
      window.localStorage.setItem(INTRO_KEY, "true");
      setShowIntro(false);
    } catch {
      setBanner("Your browser couldn’t remember this screen. You can still start your adventure.");
      setShowIntro(false);
    }
  }

  function claimDailyBonus() {
    if (claimedToday) {
      setToast("Your next daily drop arrives tomorrow.");
      return;
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const nextPlayerLevel = Math.floor((player.xp + 25) / 500) + 1;
    if (nextPlayerLevel > playerLevel) {
      setLevelUp({ previous: playerLevel, current: nextPlayerLevel });
    }
    setPlayer((previous) => ({
      ...previous,
      coins: previous.coins + 50,
      xp: previous.xp + 25,
      streak: previous.lastClaim === yesterday.toDateString() ? previous.streak + 1 : 1,
      lastClaim: today,
    }));
    setRewardCelebration(true);
    setToast("Forest gift collected · +50 coins · +25 XP");
  }

  function startChallenge(level?: number) {
    const targetLevel = level ?? currentLevel;
    if (targetLevel > currentLevel) {
      setToast("Finish the next challenge to unlock this level.");
      return;
    }
    setChallengeLevel(targetLevel);
    setCampaignAttempt(targetLevel === currentLevel);
    setSelectedAnswer("");
    setAnswerResult("");
    setBriefingExpanded(false);
    setChallengeOpen(true);
  }

  function closeChallenge() {
    window.speechSynthesis?.cancel();
    setCoachSpeaking(false);
    setChallengeOpen(false);
    setChallengeLevel(null);
    setCampaignAttempt(false);
  }

  function speakCoachBrief() {
    if (!("speechSynthesis" in window)) {
      setToast("Speech playback isn’t available in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(`${currentChallenge.title}. ${coachLine}`);
    speech.lang = "en-IN";
    speech.rate = 0.94;
    speech.onstart = () => setCoachSpeaking(true);
    speech.onend = () => setCoachSpeaking(false);
    speech.onerror = () => setCoachSpeaking(false);
    window.speechSynthesis.speak(speech);
  }

  function submitAnswer() {
    if (player.hearts <= 0) {
      setToast("You’re out of hearts. Refill with coins or wait for the next heart.");
      return;
    }
    if (!selectedAnswer) {
      setToast("Choose an answer before you submit.");
      return;
    }
    if (answerResult === "incorrect") return;
    if (selectedAnswer === currentChallenge.answer) {
      setAnswerResult("correct");
      if (campaignAttempt && player.completed < currentLevel) {
        const nextPlayerLevel = Math.floor((player.xp + 100) / 500) + 1;
        if (nextPlayerLevel > playerLevel) {
          setLevelUp({ previous: playerLevel, current: nextPlayerLevel });
        }
      }
      setPlayer((previous) => {
        if (!campaignAttempt || previous.completed >= currentLevel) return previous;
        const completed = Math.min(previous.completed + 1, 100);
        return {
          ...previous,
          completed,
          xp: previous.xp + 100,
          coins: previous.coins + 25,
          campaignCompletedAt: completed === 100 ? new Date().toISOString() : previous.campaignCompletedAt,
        };
      });
    } else {
      setAnswerResult("incorrect");
      setPlayer((previous) => {
        const hearts = Math.max(0, previous.hearts - 1);
        return {
          ...previous,
          hearts,
          heartRefillAt: hearts === 0 ? previous.heartRefillAt ?? Date.now() + HEART_REFILL_MS : previous.heartRefillAt,
        };
      });
    }
  }

  function refillHearts() {
    if (player.coins < HEART_REFILL_COST) {
      setToast(`You need ${HEART_REFILL_COST} coins to refill your hearts.`);
      return;
    }
    setSelectedAnswer("");
    setAnswerResult("");
    setPlayer((previous) => {
      if (previous.coins < HEART_REFILL_COST || previous.hearts > 0) return previous;
      return {
        ...previous,
        coins: previous.coins - HEART_REFILL_COST,
        hearts: MAX_HEARTS,
        heartRefillAt: null,
      };
    });
    setToast("Trail supplies packed · 3 hearts restored.");
  }

  function purchase(item: string, cost: number) {
    if (player.coins < cost) {
      setToast("You need more coins to unlock that item.");
      return;
    }
    setPlayer((previous) => ({ ...previous, coins: previous.coins - cost, avatar: item }));
    setToast("New look unlocked. Nice choice!");
  }

  async function signInWithGoogle() {
    setAuthMessage("");
    if (!supabase) {
      setAuthMessage("Cloud accounts are not configured yet. Add the Supabase settings in your deployment environment.");
      return;
    }

    setAuthBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        console.error("Google sign-in could not start.", error);
        setAuthMessage("Google sign-in could not start. Please try again.");
      }
    } catch (error) {
      console.error("Google sign-in request failed.", error);
      setAuthMessage("Google sign-in could not start. Please try again.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function sendEmailSignIn() {
    setAuthMessage("");
    if (!supabase) {
      setAuthMessage("Cloud accounts are not configured yet. Add the Supabase settings in your deployment environment.");
      return;
    }
    if (!authEmail.trim()) {
      setAuthMessage("Enter your email address to receive a secure sign-in link.");
      return;
    }

    setAuthBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        console.error("Email sign-in link could not be sent.", error);
        setAuthMessage("Unable to send a sign-in link. Check the email address and try again.");
      } else {
        setAuthMessage("Check your inbox for a secure sign-in link.");
      }
    } catch (error) {
      console.error("Email sign-in request failed.", error);
      setAuthMessage("Unable to send a sign-in link. Check the email address and try again.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function saveUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = usernameInput.trim();
    if (username.length < 1 || username.length > 18) {
      setUsernameMessage("Choose a name between 1 and 18 characters.");
      return;
    }
    if (!supabase || !authUser) {
      setUsernameMessage("Your account session expired. Sign in again to continue.");
      return;
    }

    setUsernameBusy(true);
    setUsernameMessage("");
    const nextPlayer = { ...playerSnapshot.current, username };
    try {
      const { error } = await supabase.from("profiles").insert(profileFromPlayer(authUser.id, nextPlayer));
      if (error) {
        console.error("Could not save the new explorer profile.", error);
        setUsernameMessage("Unable to save your name right now. Please try again.");
        return;
      }

      setPlayer(nextPlayer);
      setCloudReadyFor(authUser.id);
      setProfileState("ready");
    } catch (error) {
      console.error("New explorer profile save failed.", error);
      setUsernameMessage("Unable to save your name right now. Please try again.");
    } finally {
      setUsernameBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Could not sign out.", error);
        setAuthMessage("Unable to sign out. Please try again.");
        return;
      }
      setAuthOpen(false);
      setAuthMessage("");
    } catch (error) {
      console.error("Sign-out request failed.", error);
      setAuthMessage("Unable to sign out. Please try again.");
    }
  }

  function renderMainView() {
    if (view === "hall-of-fame") {
      const completedAt = player.campaignCompletedAt ? new Date(player.campaignCompletedAt) : null;
      const completionDate = completedAt && Number.isFinite(completedAt.getTime())
        ? new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(completedAt)
        : "DATE NOT RECORDED";
      return (
        <section className={`hall-of-fame${player.completed < 100 ? " hall-locked" : ""}`}>
          <div className="hall-crown" aria-hidden="true">♛</div>
          <p className="eyebrow">{player.completed >= 100 ? "THE WILD REMEMBERS YOUR NAME" : "THE FINAL TRAIL AWAITS"}</p>
          <h1>{player.completed >= 100 ? "Hall of Fame." : "One day, your name."}</h1>
          {player.completed >= 100 ? (
            <>
              <p className="hall-intro">One hundred trails. One relentless explorer. You made it all the way through.</p>
              <div className="hall-entry">
                <span className="hall-entry-avatar">{avatar}</span>
                <div><small>FOREST EXPEDITION · GRAND FINISHER</small><strong>{player.username}</strong><span>CAMPAIGN COMPLETED {completionDate.toUpperCase()}</span></div>
                <b>100</b>
              </div>
              <div className="hall-laurel" aria-hidden="true">✦ &nbsp; CODE ESCAPE MASTER &nbsp; ✦</div>
            </>
          ) : (
            <>
              <p className="hall-intro">The Hall of Fame is earned, never bought. Complete every trail and your explorer name and finish date will be kept here on this device.</p>
              <div className="hall-progress"><div><span>CAMPAIGN PROGRESS</span><strong>{player.completed} / 100</strong></div><i><b style={{ width: `${progressPercent}%` }} /></i></div>
              <button className="primary-button" onClick={() => { setView("home"); startChallenge(); }}>CONTINUE THE EXPEDITION <span>↗</span></button>
            </>
          )}
        </section>
      );
    }
    if (view === "worlds") {
      return (
        <>
          <section className="page-heading">
            <div><p className="eyebrow">YOUR ADVENTURE</p><h1>The world map<span className="heading-period">.</span></h1>
              <p className="heading-copy">Every world teaches a new way to think like a programmer.</p></div>
            <div className="campaign-chip"><span>♧</span><strong>100</strong><small>TRAIL LEVELS</small></div>
          </section>
          <div className="world-list">
            {worlds.map((world, index) => {
              const isUnlocked = index <= activeWorldIndex;
              const worldCompleted = Math.min(world.end - world.start + 1, Math.max(0, player.completed - world.start + 1));
              return (
                <article className={`world-card world-${world.color}${isUnlocked ? "" : " world-locked"}`} key={world.name}>
                  <div className="world-symbol">{isUnlocked ? world.icon : "⌑"}</div>
                  <div className="world-info"><p className="eyebrow">{world.range}</p><h2>{world.name}</h2><p>{isUnlocked ? `${worldCompleted} of ${world.end - world.start + 1} trail markers found` : "Explore the previous trail to unlock."}</p></div>
                  <div className="world-side"><span className="world-progress">{isUnlocked ? `${worldCompleted}/${world.end - world.start + 1}` : "LOCKED"}</span><div className="mini-progress"><i style={{ width: `${worldCompleted / (world.end - world.start + 1) * 100}%` }} /></div><button className="icon-button" aria-label={`Open ${world.name}`} onClick={() => isUnlocked ? startChallenge(Math.max(currentLevel, world.start)) : setToast("Keep going—you’re closer than you think.")}>↗</button></div>
                </article>
              );
            })}
          </div>
        </>
      );
    }
    if (view === "leaderboard") {
      const demoRows = [
        { rank: "01", name: "pixelpioneer", level: 18, xp: "2,840 XP", avatar: "🦊", isYou: false },
        { rank: "02", name: "looplegend", level: 15, xp: "2,210 XP", avatar: "🐼", isYou: false },
        { rank: "03", name: "bytebloom", level: 12, xp: "1,960 XP", avatar: "🐸", isYou: false },
        { rank: "04", name: player.username, level: currentLevel, xp: `${player.xp.toLocaleString()} XP`, avatar, isYou: true },
      ];
      const liveRows = leaderboardRows.map((row, index) => ({
        rank: String(index + 1).padStart(2, "0"),
        name: row.username,
        level: Math.floor(row.xp / 500) + 1,
        xp: `${row.xp.toLocaleString()} XP`,
        avatar: row.avatar,
        isYou: Boolean(authUser) && row.username === player.username,
      }));
      const rows = isSupabaseConfigured ? liveRows : demoRows;
      const leaderboardLoading = isSupabaseConfigured && !leaderboardLoaded && !leaderboardError;

      return (
        <>
          <section className="page-heading"><div><p className="eyebrow">THE FRIENDLY RIVALRY</p><h1>Leaderboard<span className="heading-period">.</span></h1><p className="heading-copy">A little competition makes the next level even sweeter.</p></div><div className="period-pill">ALL TIME <span>✦</span></div></section>
          <section className="feature-card leaderboard-card"><div className="card-title-row"><div><p className="eyebrow">TOP EXPLORERS</p><h2>Out here making moves.</h2></div><span className="live-pill"><i /> LIVE</span></div>
            <div className="leader-row leader-head"><span>RANK</span><span>PLAYER</span><span>LEVEL</span><span>XP EARNED</span></div>
            {isSupabaseConfigured && leaderboardLoading && <div className="leader-state" role="status">Loading leaderboard…</div>}
            {isSupabaseConfigured && leaderboardError && <div className="leader-state leader-error" role="alert">Unable to load leaderboard. <button onClick={() => { setLeaderboardError(false); setLeaderboardLoaded(false); setLeaderboardRetry((value) => value + 1); }}>Try again.</button></div>}
            {isSupabaseConfigured && !leaderboardLoading && !leaderboardError && rows.length === 0 && <div className="leader-state">No players on the leaderboard yet. Be the first to sign in and play.</div>}
            {(!isSupabaseConfigured || (!leaderboardLoading && !leaderboardError)) && rows.map((row) => <div className={`leader-row${row.isYou ? " leader-you" : ""}`} key={row.rank}><span className={`rank rank-${row.rank}`}>{row.rank}</span><span className="leader-player"><i>{row.avatar}</i>{row.name}{row.isYou && <small>YOU</small>}</span><span>LVL {row.level}</span><strong>{row.xp}</strong></div>)}
            <div className="leader-note">{isSupabaseConfigured ? "Live scores from player profiles. Sign in to save your progress across devices." : "Sample leaderboard preview. Configure Supabase and sign in to compete with other players."}</div>
          </section>
        </>
      );
    }
    if (view === "achievements") {
      const achievements = [
        { icon: "👣", title: "First footsteps", detail: "Complete your first trail marker", done: player.completed >= 1 },
        { icon: "🌿", title: "Trail regular", detail: "Complete 5 trail markers", done: player.completed >= 5 },
        { icon: "🍄", title: "Forest finder", detail: "Collect 100 coins from the wild", done: player.coins >= 100 },
        { icon: "🔥", title: "Return to the wild", detail: "Build a 3-day trail streak", done: player.streak >= 3 },
        { icon: "🌳", title: "Deep woods", detail: "Reach Mosslight Forest", done: player.completed >= 25 },
        { icon: "🏛️", title: "Temple seeker", detail: "Complete the 100-level trail", done: player.completed >= 100 },
      ];
      return (
        <>
          <section className="page-heading"><div><p className="eyebrow">PROOF OF YOUR PROGRESS</p><h1>Achievements<span className="heading-period">.</span></h1><p className="heading-copy">Little wins add up to something pretty big.</p></div><div className="campaign-chip"><span>✧</span><strong>{achievements.filter((item) => item.done).length}<small>/{achievements.length}</small></strong><small>UNLOCKED</small></div></section>
          <section className="achievement-grid">{achievements.map((item) => <article className={`achievement-card${item.done ? " achievement-earned" : ""}`} key={item.title}><span className="achievement-icon">{item.done ? item.icon : "🔒"}</span><div><h2>{item.title}</h2><p>{item.detail}</p></div><span className="achievement-state">{item.done ? "UNLOCKED" : "IN PROGRESS"}</span></article>)}</section>
        </>
      );
    }
    if (view === "shop") {
      return (
        <>
          <section className="page-heading"><div><p className="eyebrow">GEAR UP FOR THE WILD</p><h1>Trail gear<span className="heading-period">.</span></h1><p className="heading-copy">Bring a new explorer along for your next run.</p></div><div className="coin-total">◈ <strong>{player.coins}</strong></div></section>
          <section className="shop-grid">{[{ emoji: "🧗", title: "Trail rookie", cost: 0 }, { emoji: "🦊", title: "Forest fox", cost: 75 }, { emoji: "🐼", title: "Bamboo buddy", cost: 150 }, { emoji: "🦜", title: "Canopy guide", cost: 250 }].map((item) => <article className="shop-card" key={item.title}><div className="shop-avatar">{item.emoji}</div><h2>{item.title}</h2><p>A new trail companion for the wild ahead.</p><button className="shop-buy" disabled={avatar === item.emoji} onClick={() => purchase(item.emoji, item.cost)}>{avatar === item.emoji ? "EQUIPPED" : item.cost === 0 ? "FREE STARTER" : `◈ ${item.cost}  ·  UNLOCK`}</button></article>)}</section>
        </>
      );
    }
    return (
      <>
        <section className="welcome-row">
          <div><p className="eyebrow">{dateLabel} <span className="eyebrow-star">♧</span></p><h1>Hey, {player.username}<span className="heading-period">.</span></h1><p className="heading-copy">The canopy is calling. Your next trail marker is waiting.</p></div>
          <div className="streak-pill"><span>🔥</span><strong>{player.streak}</strong><small>DAY STREAK</small></div>
        </section>

        <section className="hero-card">
          <div className="hero-content"><div className="world-label"><span className="world-pulse" /> WORLD {String(activeWorldIndex + 1).padStart(2, "0")} <i>·</i> {activeWorld.name.toUpperCase()}</div><h2>{currentLevel === activeWorld.end ? "The final trail." : "Your next trail."}<br />{currentLevel === activeWorld.end ? <>Find what lies <em>beyond.</em></> : <>Into the <em>wild.</em></>}</h2><p>Read the terrain. Solve real code. Earn your next step deeper into the wild.</p><button className="primary-button" onClick={() => startChallenge()}>ENTER EXPEDITION <span>↗</span></button><div className="hero-meta"><span><i>♧</i> LEVEL {String(currentLevel).padStart(2, "0")}</span><span><i>◷</i> ~5 min</span><span><i>✧</i> +100 XP</span></div></div>
          <div className="hero-scene-ui" aria-hidden="true">
            <span className="scene-title"><strong>CODE <i>ESCAPE</i></strong><b>MASTER <span>·</span> WILD TRAILS</b></span>
            <Image className="hero-explorer" src="/trail-coach.svg" alt="" width={360} height={500} priority />
            <span className="scene-avatar-badge"><i>{avatar}</i><span>YOUR EXPLORER</span></span>
            <span className="scene-coordinate"><i /> {activeWorld.name.toUpperCase()} <b>·</b> FIELD ZONE {String(currentLevel).padStart(2, "0")}</span>
            <span className="scene-beacon"><i>{activeWorld.icon}</i><b>{currentChallenge.topic.split(" · ")[0]}</b><small>EXPEDITION {String(currentLevel).padStart(2, "0")}</small></span>
            <span className="scene-trail-label">NEXT MARKER <i>↗</i></span>
          </div>
          <div className="hero-bottom"><span>YOUR CAMPAIGN</span><strong>{player.completed} <i>/ 100 LEVELS</i></strong><div className="hero-track"><i style={{ width: `${progressPercent}%` }} /></div><span className="hero-percent">{progressPercent}%</span></div>
        </section>

        <section className="stats-grid">
          <article className="stat-card"><div className="stat-icon xp-icon">✧</div><p>TOTAL EXPERIENCE</p><strong>{player.xp.toLocaleString()}<small> XP</small></strong><div className="stat-foot"><span>RANK {playerLevel}</span><span>{player.xp % 500} / 500 TO NEXT</span></div><div className="stat-track"><i style={{ width: `${(player.xp % 500) / 5}%` }} /></div></article>
          <article className="stat-card"><div className="stat-icon coin-icon">◈</div><p>COIN BALANCE</p><strong>{player.coins.toLocaleString()}<small> COINS</small></strong><div className="stat-foot"><span>+25 PER CHALLENGE</span><button className="text-button" onClick={() => setView("shop")}>VISIT SHOP ↗</button></div><div className="stat-track coin-track"><i style={{ width: `${Math.min(player.coins / 5, 100)}%` }} /></div></article>
        </section>

        <section className="lower-grid">
          <article className="feature-card map-card"><div className="card-title-row"><div><p className="eyebrow">{activeWorld.name.toUpperCase()} · SECTOR {String(Math.floor((currentLevel - activeWorld.start) / 10) + 1).padStart(2, "0")}</p><h2>Trail markers.</h2></div><button className="text-button" onClick={() => setView("worlds")}>EXPLORE MAP ↗</button></div><div className="map-path"><div className="path-line"><i style={{ width: `${levelProgress}%` }} /></div>{visibleLevels.map((level) => <button key={level} onClick={() => startChallenge(level)} aria-label={`Level ${level}${level <= currentLevel ? ", unlocked" : ", locked"}`} className={`level-node${level < currentLevel ? " node-done" : level === currentLevel ? " node-current" : " node-locked"}`}><span>{level < currentLevel ? "✓" : level <= currentLevel ? "♧" : "·"}</span><small>{String(level).padStart(2, "0")}</small></button>)}</div><div className="map-legend"><span><i className="legend-done" /> EXPLORED</span><span><i className="legend-current" /> YOUR TRAIL</span><span><i className="legend-locked" /> AHEAD</span></div></article>
          <article className={`feature-card daily-card${rewardCelebration ? " daily-celebrating" : ""}`}>
            <div className="daily-spark" aria-hidden="true">✦</div>
            {rewardCelebration && <div className="reward-burst" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <span key={index}>◈</span>)}</div>}
            <p className="eyebrow">A GIFT FROM THE FOREST</p>
            <h2>Come back.<br /><span>Grow stronger.</span></h2>
            <p className="daily-copy">The forest leaves a little something for its returning explorers.</p>
            <div className="daily-reward"><span>◈</span><strong>+50</strong><small>COINS</small></div>
            <div className="daily-xp-reward"><span>✧</span><strong>+25 XP</strong><small>GROW YOUR SKILLS</small></div>
            <button className={`daily-button${claimedToday ? " daily-claimed" : ""}`} onClick={claimDailyBonus}>{claimedToday ? "COLLECTED FOR TODAY ✓" : "COLLECT DAILY BONUS ↗"}</button>
          </article>
        </section>
      </>
    );
  }

  function renderAccountDialog() {
    if (!authOpen) return null;
    const required = isSupabaseConfigured && !authUser;

    return (
      <div className="account-backdrop" role="presentation" onClick={(event) => {
        if (!required && event.target === event.currentTarget) setAuthOpen(false);
      }}>
        <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-title">
          {!required && <button className="account-close" aria-label="Close account dialog" onClick={() => setAuthOpen(false)}>×</button>}
          <p className="eyebrow">{required ? "FIRST, YOUR EXPLORER ACCOUNT" : "YOUR PROGRESS, EVERYWHERE"}</p>
          <h2 id="account-title">{authUser ? "Explorer account" : "Join the expedition."}</h2>
          {authUser ? (
            <>
              <p className="account-copy">Signed in as <strong>{authUser.email ?? "Google account"}</strong>. Your progress syncs to your account when Supabase is configured.</p>
              <button className="account-primary" onClick={signOut}>SIGN OUT</button>
            </>
          ) : (
            <>
              <p className="account-copy">{required ? "Sign in first. Then you’ll choose your explorer name before the game begins." : "Sign in to sync your trail progress and appear on the global leaderboard."}</p>
              <button className="google-signin" onClick={signInWithGoogle} disabled={authBusy}><span aria-hidden="true">G</span>{authBusy ? "CONNECTING…" : "CONTINUE WITH GOOGLE"}</button>
              <div className="account-divider"><span>OR USE EMAIL</span></div>
              <form className="email-signin" onSubmit={(event) => { event.preventDefault(); void sendEmailSignIn(); }}>
                <label htmlFor="account-email">Email address</label>
                <input id="account-email" type="email" autoComplete="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" required />
                <button className="account-primary" type="submit" disabled={authBusy}>{authBusy ? "SENDING LINK…" : "EMAIL ME A SIGN-IN LINK"}</button>
              </form>
              {!isSupabaseConfigured && <p className="account-setup-note">Account sign-in will be ready after the Supabase project is connected.</p>}
            </>
          )}
          {authMessage && <p className="account-message" role="status">{authMessage}</p>}
        </section>
      </div>
    );
  }

  if (!ready || (isSupabaseConfigured && !authChecked)) {
    return <main className="loading-screen"><Brand /><div className="loading-orb"><span /></div><p>PREPARING YOUR NEXT ADVENTURE</p><div className="loading-track"><i /></div></main>;
  }

  if (isSupabaseConfigured && authUser && (profileState === "idle" || profileState === "loading")) {
    return <main className="loading-screen"><Brand /><div className="loading-orb"><span /></div><p>RESTORING YOUR EXPEDITION</p><div className="loading-track"><i /></div></main>;
  }

  if (isSupabaseConfigured && authUser && profileState === "error") {
    return (
      <main className="onboarding-screen">
        <div className="onboarding-card">
          <Brand />
          <p className="eyebrow">YOUR TRAIL IS STILL HERE</p>
          <h1>Unable to load your profile.</h1>
          <p className="account-copy">Your progress is safe. Check your connection, then try again.</p>
          <button className="account-primary" onClick={() => { setProfileState("loading"); setProfileRetry((attempt) => attempt + 1); }}>TRY AGAIN</button>
          <button className="onboarding-signout" onClick={signOut}>SIGN OUT</button>
        </div>
      </main>
    );
  }

  if (isSupabaseConfigured && authUser && profileState === "username") {
    return (
      <main className="onboarding-screen">
        <div className="onboarding-card">
          <Brand />
          <p className="eyebrow">ONE LAST STEP BEFORE THE TRAIL</p>
          <h1>What should we call you?</h1>
          <p className="account-copy">Choose your explorer name. You can change it later in your player settings.</p>
          <form className="username-form" onSubmit={(event) => void saveUsername(event)}>
            <label htmlFor="explorer-username">Explorer name</label>
            <input id="explorer-username" type="text" autoComplete="nickname" autoFocus maxLength={18} value={usernameInput} onChange={(event) => setUsernameInput(event.target.value)} placeholder="Your name" required />
            <small>1–18 characters</small>
            <button className="account-primary" type="submit" disabled={usernameBusy}>{usernameBusy ? "SAVING YOUR PROFILE…" : "ENTER THE FOREST ↗"}</button>
          </form>
          {usernameMessage && <p className="account-message" role="alert">{usernameMessage}</p>}
        </div>
      </main>
    );
  }

  if (showIntro || (isSupabaseConfigured && !authUser)) {
    return (
      <main className="intro-screen">
        <div className="intro-world" aria-hidden="true">
          <div className="intro-sunbeam" />
          <div className="intro-fireflies"><i /><i /><i /><i /><i /></div>
          <div className="intro-path-mark">01</div>
        </div>
        <div className="intro-vignette" />
        <header className="intro-header">
          <Brand />
          <span className="intro-campaign"><i /> 100 LEVELS <b>·</b> ONE WILD ADVENTURE</span>
        </header>
        <section className="intro-copy">
          <p className="intro-overline"><span>THE WILDS ARE CALLING</span><i /></p>
          <h1 className="intro-title"><span>CODE</span><span className="intro-title-accent">ESCAPE</span><span className="intro-title-last">MASTER<span className="intro-title-dot">.</span></span></h1>
          <p className="intro-tagline">RUN THE TRAIL.<br /><strong>MASTER THE CODE.</strong></p>
          <p className="intro-description">Race through ancient forests. Crack coding challenges. Find your way to the lost temple.</p>
          <button className="intro-cta" onClick={beginAdventure}><span>START YOUR ADVENTURE</span><i>↗</i></button>
          <div className="intro-trailer-notes"><span>⌘ &nbsp;REAL CODE, REAL SKILLS</span><i>·</i><span>♧ &nbsp;BUILT FOR THE CURIOUS</span></div>
        </section>
        <Image className="intro-guide-portrait" src="/trail-coach.svg" alt="Kabir, an original fictional forest expedition guide in cricket gear" width={360} height={500} priority />
        <div className="intro-bottom"><span>CANOPY CROSSING <i>—</i> TRAILHEAD 001</span><span>NO SHORTCUTS IN THE WILD.</span></div>
        <div className="intro-scroll"><span>ENTER THE FOREST</span><i /></div>
        {renderAccountDialog()}
      </main>
    );
  }

  return (
    <div className="app-shell">
      {mobileMenuOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`sidebar${mobileMenuOpen ? " sidebar-open" : ""}`}>
        <Brand />
        <div className="sidebar-label">YOUR TRAIL</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => <button key={item.id} className={`nav-item${view === item.id ? " nav-active" : ""}`} onClick={() => { setView(item.id); setMobileMenuOpen(false); }}><Icon>{item.icon}</Icon><span>{item.label}</span>{item.id === "shop" && <span className="nav-new">NEW</span>}</button>)}
        </nav>
        <div className="sidebar-world"><div className="sidebar-world-icon">✦</div><p className="eyebrow">NOW EXPLORING</p><strong>{activeWorld.name}</strong><div className="world-progress-label"><span>WORLD PROGRESS</span><span>{completedInWorld}/{activeWorld.end - activeWorld.start + 1}</span></div><div className="mini-progress"><i style={{ width: `${completedInWorld / (activeWorld.end - activeWorld.start + 1) * 100}%` }} /></div></div>
        <div className="sidebar-bottom"><button className="settings-button" onClick={() => { const name = window.prompt("What should we call you?", player.username); if (name?.trim()) setPlayer((previous) => ({ ...previous, username: name.trim().slice(0, 18) })); }}>⚙ <span>Player settings</span></button><div className="profile-row"><div className="profile-avatar">{avatar}</div><div className="profile-copy"><strong>{player.username}</strong><span>RANK {playerLevel} EXPLORER</span></div><span className="profile-menu">···</span></div></div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileMenuOpen(true)}>☰</button>
          <div className="breadcrumb"><span>CODE ESCAPE</span><i>/</i><strong>{navItems.find((item) => item.id === view)?.label.toUpperCase()}</strong></div>
          <div className="topbar-right">
            <div className="connection-status"><span className={isOnline ? "connection-dot" : "connection-dot connection-offline"} />{isOnline ? "TRAIL IS CLEAR" : "OFFLINE · PROGRESS SAVED"}</div>
            <div className="life-counter" aria-label={`${player.hearts} of ${MAX_HEARTS} hearts remaining`} title={`${player.hearts} of ${MAX_HEARTS} hearts`}><span>♥</span><strong>{player.hearts}/{MAX_HEARTS}</strong></div>
            <div className="topbar-coins">◈ <strong>{player.coins}</strong></div>
            <button className="account-button" onClick={() => { setAuthMessage(""); setAuthOpen(true); }}>{authUser ? "ACCOUNT" : "SIGN IN"}</button>
            <button className="topbar-avatar" aria-label="Edit player profile" onClick={() => { const name = window.prompt("What should we call you?", player.username); if (name?.trim()) setPlayer((previous) => ({ ...previous, username: name.trim().slice(0, 18) })); }}>{avatar}</button>
          </div>
        </header>
        {!isOnline && <div className="status-banner offline-banner"><span>Connection lost. Your progress is safe.</span><button onClick={() => window.location.reload()}>TRY AGAIN ↻</button></div>}
        {banner && <div className="status-banner error-banner"><span>{banner}</span><button onClick={() => setBanner("")}>DISMISS</button></div>}
        <div className="page-content">{renderMainView()}<footer className="page-footer"><Brand compact /><span>TAKE NOTHING BUT KNOWLEDGE. LEAVE NOTHING BUT FOOTPRINTS.</span><button onClick={() => { if (window.confirm("Reset this device’s saved game progress? This cannot be undone.")) { setPlayer(initialPlayer); setBanner(""); } }}>RESET DEMO</button></footer></div>
      </main>
      {toast && <div className="toast-message" role="status"><span>✦</span>{toast}</div>}
      {renderAccountDialog()}
      {rewardCelebration && (
        <div className="reward-cinematic" role="dialog" aria-modal="true" aria-label="Daily reward collected">
          <div className="reward-rays" aria-hidden="true" />
          <button className="reward-skip" aria-label="Close reward animation" onClick={() => setRewardCelebration(false)}>×</button>
          <p>THE FOREST REMEMBERS</p>
          <h2>TRAIL REWARD</h2>
          <div className="cinematic-coin" aria-hidden="true"><span>◈</span><i>+50</i></div>
          <strong>50 COINS <span>·</span> 25 XP</strong>
          <div className="cinematic-xp"><i>✧</i><span>+25 XP</span><small>TRAIL KNOWLEDGE</small></div>
          <small>YOUR NEXT TRAIL IS WAITING</small>
        </div>
      )}
      {challengeOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeChallenge();
          }}
        >
          <section className="challenge-modal" role="dialog" aria-modal="true" aria-labelledby="challenge-title">
            <button className="modal-close" aria-label="Close challenge" onClick={closeChallenge}>×</button>
            <div className="modal-topline">
              <span>WORLD {String(challengeWorldIndex + 1).padStart(2, "0")} · CHALLENGE {String(activeChallengeLevel).padStart(2, "0")}</span>
              <span>✧ +100 XP</span>
            </div>
            <div className="challenge-hearts" role="img" aria-label={`${player.hearts} of ${MAX_HEARTS} hearts remaining`}>
              <span className="challenge-hearts-label">TRAIL LIVES</span>
              <div className="heart-row">
                {Array.from({ length: MAX_HEARTS }, (_, index) => (
                  <span key={index} className={`heart-icon${index < player.hearts ? " heart-full" : " heart-empty"}`} aria-hidden="true">♥</span>
                ))}
              </div>
              <span className="challenge-hearts-count">{player.hearts}/{MAX_HEARTS}</span>
            </div>
            {player.hearts === 0 ? (
              <div className="heart-recovery">
                <div className="recovery-icon" aria-hidden="true">♡</div>
                <p className="eyebrow">TAKE A BREATHER</p>
                <h2 id="challenge-title">Out of trail lives.</h2>
                {answerResult === "incorrect" && <div className="answer-error" role="alert"><strong>That answer cost your last heart.</strong><span>{currentChallenge.hint}</span></div>}
                <p>{player.coins >= HEART_REFILL_COST
                  ? "You’ve used all three hearts. Refill with coins to jump back in, or wait for your next heart to return."
                  : "You’ve used all three hearts and don’t have enough coins for a refill. Your next heart is on its way."}</p>
                {player.coins >= HEART_REFILL_COST ? (
                  <button className="refill-button" onClick={refillHearts}>REFILL 3 HEARTS <span>◈ {HEART_REFILL_COST}</span></button>
                ) : (
                  <div className="refill-wait" role="status">
                    <span>◷</span>
                    <strong>{player.heartRefillAt === null ? "10:00" : formatCountdown(player.heartRefillAt - clockNow)}</strong>
                    <small>UNTIL YOUR NEXT HEART</small>
                  </div>
                )}
                <p className="recovery-balance">YOUR COINS <strong>◈ {player.coins}</strong><span>·</span> REFILL COST <strong>◈ {HEART_REFILL_COST}</strong></p>
              </div>
            ) : answerResult === "correct" ? (
              <div className="challenge-result">
                <div className="result-star">✦</div>
                <p className="eyebrow">{campaignAttempt ? "NAILED IT" : "PRACTICE COMPLETE"}</p>
                <h2 id="challenge-title">{campaignAttempt ? "That’s how it’s done." : "Trail knowledge gained."}</h2>
                <p>{campaignAttempt
                  ? "You read the trail, cracked the code, and guided your crew one step closer to the lost temple."
                  : "You can replay completed trails to sharpen your skills. Campaign rewards are earned on your next new trail."}</p>
                {campaignAttempt && <div className="reward-earned"><span>✧ +100 XP</span><span>◈ +25 COINS</span></div>}
                <button className="primary-button" onClick={() => { closeChallenge(); setView("home"); }}>{campaignAttempt ? "Back to your journey" : "Back to camp"} <span>↗</span></button>
              </div>
            ) : (
              <>
                <p className="eyebrow challenge-eyebrow">{currentChallenge.topic.replace(/LEVEL \d+/, `LEVEL ${activeChallengeLevel}`)}</p>
                <h2 id="challenge-title">{currentChallenge.title}</h2>
                <div className={`coach-brief${coachSpeaking ? " coach-speaking" : ""}${briefingExpanded ? " coach-brief-expanded" : ""}`}>
                  <Image src="/trail-coach.svg" alt="" width={72} height={100} />
                  <div><span>FIELD CAPTAIN · KABIR <small>FICTIONAL GUIDE</small></span><p>{coachLine}</p></div>
                  <button className="briefing-toggle" onClick={() => setBriefingExpanded((expanded) => !expanded)} aria-expanded={briefingExpanded}>{briefingExpanded ? "LESS" : "BRIEF"}</button>
                  <button className="coach-speak-button" onClick={speakCoachBrief} aria-label="Hear Kabir read the mission" aria-pressed={coachSpeaking}>{coachSpeaking ? "▣" : "🔊"}</button>
                </div>
                <div className="code-window">
                  <div className="code-toolbar"><span><i /> <i /> <i /></span><span>challenge.js</span><span>JS</span></div>
                  <pre>{currentChallenge.codeBefore}<span className="code-highlight">???</span>{currentChallenge.codeAfter}</pre>
                </div>
                <div className="answer-label">PICK THE MISSING LINE</div>
                <div className="answer-list">
                  {currentChallenge.options.map((option, index) => (
                    <button
                      key={option}
                      className={`answer-option${selectedAnswer === option ? " answer-selected" : ""}${answerResult === "incorrect" && selectedAnswer === option ? " answer-wrong" : ""}`}
                      onClick={() => { setSelectedAnswer(option); setAnswerResult(""); }}
                    >
                      <span>{String.fromCharCode(65 + index)}</span>
                      <code>{option}</code>
                      <i>{selectedAnswer === option ? "●" : "○"}</i>
                    </button>
                  ))}
                </div>
                {answerResult === "incorrect" && <div className="answer-error" role="alert"><strong>Not quite — one heart lost.</strong><span>{currentChallenge.hint}</span></div>}
                <button className="submit-button" onClick={submitAnswer} disabled={answerResult === "incorrect"}>Run your solution <span>↗</span></button>
                <p className="challenge-hint">STUCK? {currentChallenge.hint}</p>
              </>
            )}
          </section>
        </div>
      )}
      {levelUp && (
        <div className="level-up-backdrop">
          <section className="level-up-dialog" role="dialog" aria-modal="true" aria-labelledby="level-up-title">
            <div className="level-up-sparks" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
            <span className="level-up-kicker">EXPEDITION RANK INCREASED</span>
            <div className="level-up-badge" aria-hidden="true"><span>{levelUp.current}</span><i>✦</i></div>
            <p className="level-up-overline">LEVEL UP</p>
            <h2 id="level-up-title">You’re rank {levelUp.current}.</h2>
            <p className="level-up-copy">Your code is sharper. The wilds go deeper.</p>
            <div className="level-up-progress"><span>RANK {levelUp.previous}</span><i>→</i><strong>RANK {levelUp.current}</strong></div>
            <button className="level-up-button" onClick={() => setLevelUp(null)}>KEEP EXPLORING <span>↗</span></button>
          </section>
        </div>
      )}
    </div>
  );
}
