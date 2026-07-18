"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const defaultForm = {
  name: "",
  branch: "",
  year: 1,
  gender: "",
  sleep_time: 23,
  wake_time: 7,
  cleanliness: 3,
  noise_tolerance: 3,
  food_pref: "either",
  study_style: "room",
  smoking: false,
  drinking: false,
  guests_ok: true,
  social_type: "ambivert",
  ac_preference: "no_preference",
  music_while_studying: false,
  night_calls: "sometimes",
  language: "",
  sharing_ok: true,
  hostel_pref: "",
};

export default function Profile() {
  const [form, setForm] = useState(defaultForm);
  const [userId, setUserId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) setForm({ ...defaultForm, ...data });
      setLoading(false);
    }
    load();
  }, [router]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...form });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Saved!");
      setTimeout(() => router.push("/matches"), 800);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            className="border rounded-lg px-3 py-2 w-full"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Gender</label>
          <select
            className="border rounded-lg px-3 py-2 w-full"
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
            required
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            You'll only be matched with students of the same gender, since
            hostels are gender-specific.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Preferred / current hostel
          </label>
          <input
            className="border rounded-lg px-3 py-2 w-full"
            value={form.hostel_pref}
            onChange={(e) => update("hostel_pref", e.target.value)}
            placeholder="e.g. Hostel H, Girls Hostel 3"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Branch</label>
            <input
              className="border rounded-lg px-3 py-2 w-full"
              value={form.branch}
              onChange={(e) => update("branch", e.target.value)}
              placeholder="COE, ENC, MECH..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <select
              className="border rounded-lg px-3 py-2 w-full"
              value={form.year}
              onChange={(e) => update("year", Number(e.target.value))}
            >
              {[1, 2, 3, 4].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            What time do you usually sleep? ({form.sleep_time}:00)
          </label>
          <input
            type="range"
            min="20"
            max="30"
            value={form.sleep_time > 20 ? form.sleep_time : form.sleep_time + 24}
            onChange={(e) => update("sleep_time", Number(e.target.value) % 24)}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            What time do you usually wake up? ({form.wake_time}:00)
          </label>
          <input
            type="range"
            min="4"
            max="12"
            value={form.wake_time}
            onChange={(e) => update("wake_time", Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Cleanliness ({form.cleanliness}/5)
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={form.cleanliness}
            onChange={(e) => update("cleanliness", Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Noise tolerance ({form.noise_tolerance}/5)
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={form.noise_tolerance}
            onChange={(e) => update("noise_tolerance", Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Food preference
            </label>
            <select
              className="border rounded-lg px-3 py-2 w-full"
              value={form.food_pref}
              onChange={(e) => update("food_pref", e.target.value)}
            >
              <option value="veg">Vegetarian</option>
              <option value="nonveg">Non-vegetarian</option>
              <option value="either">Either</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Study style
            </label>
            <select
              className="border rounded-lg px-3 py-2 w-full"
              value={form.study_style}
              onChange={(e) => update("study_style", e.target.value)}
            >
              <option value="library">Library</option>
              <option value="room">In room</option>
              <option value="group">Group study</option>
              <option value="late-night">Late night</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Social type
            </label>
            <select
              className="border rounded-lg px-3 py-2 w-full"
              value={form.social_type}
              onChange={(e) => update("social_type", e.target.value)}
            >
              <option value="introvert">Introvert - I like quiet time</option>
              <option value="ambivert">Ambivert - depends on the day</option>
              <option value="extrovert">Extrovert - I like company around</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              AC / temperature
            </label>
            <select
              className="border rounded-lg px-3 py-2 w-full"
              value={form.ac_preference}
              onChange={(e) => update("ac_preference", e.target.value)}
            >
              <option value="cold">I like it cold</option>
              <option value="warm">I like it warm</option>
              <option value="no_preference">No strong preference</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Late-night calls with family/partner
          </label>
          <select
            className="border rounded-lg px-3 py-2 w-full"
            value={form.night_calls}
            onChange={(e) => update("night_calls", e.target.value)}
          >
            <option value="rarely">Rarely</option>
            <option value="sometimes">Sometimes</option>
            <option value="often">Often</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Languages you're comfortable speaking
          </label>
          <input
            className="border rounded-lg px-3 py-2 w-full"
            value={form.language}
            onChange={(e) => update("language", e.target.value)}
            placeholder="e.g. Hindi, Punjabi, English"
          />
        </div>

        <div className="flex gap-6 flex-wrap">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.smoking}
              onChange={(e) => update("smoking", e.target.checked)}
            />
            I smoke
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.drinking}
              onChange={(e) => update("drinking", e.target.checked)}
            />
            I drink
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.music_while_studying}
              onChange={(e) => update("music_while_studying", e.target.checked)}
            />
            I play music while studying
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.guests_ok}
              onChange={(e) => update("guests_ok", e.target.checked)}
            />
            I'm okay with guests in the room
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.sharing_ok}
              onChange={(e) => update("sharing_ok", e.target.checked)}
            />
            I'm okay sharing gadgets/food/chargers
          </label>
        </div>

        <button
          type="submit"
          className="bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
        >
          Save Profile
        </button>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </form>
    </div>
  );
}
