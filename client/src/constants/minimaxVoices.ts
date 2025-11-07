import { VoiceOption } from "@/types";

interface MinimaxVoiceDefinition {
  language: string;
  voiceId: string;
  voiceName: string;
}

const RAW_MINIMAX_VOICE_TABLE = String.raw`
| No. | Language           | Voice_id                                    | Voice_name               |
| 1   | English            | English_expressive_narrator                | Expressive Narrator       |
| 2   | English            | English_radiant_girl                       | Radiant Girl              |
| 3   | English            | English_magnetic_voiced_man               | Magnetic-voiced Male      |
| 4   | English            | English_compelling_lady1                   | Compelling Lady           |
| 5   | English            | English_Aussie_Bloke                       | Aussie Bloke              |
| 6   | English            | English_captivating_female1                | Captivating Female        |
| 7   | English            | English_Upbeat_Woman                       | Upbeat Woman              |
| 8   | English            | English_Trustworth_Man                     | Trustworthy Man           |
| 9   | English            | English_CalmWoman                           | Calm Woman                |
| 10  | English            | English_UpsetGirl                           | Upset Girl                |
| 11  | English            | English_Gentle-voiced_man                  | Gentle-voiced Man         |
| 12  | English            | English_Whispering_girl                    | Whispering girl           |
| 13  | English            | English_Diligent_Man                       | Diligent Man              |
| 14  | English            | English_Graceful_Lady                      | Graceful Lady             |
| 15  | English            | English_ReservedYoungMan                    | Reserved Young Man        |
| 16  | English            | English_PlayfulGirl                         | Playful Girl              |
| 17  | English            | English_ManWithDeepVoice                    | Man With Deep Voice       |
| 18  | English            | English_MaturePartner                       | Mature Partner            |
| 19  | English            | English_FriendlyPerson                      | Friendly Guy              |
| 20  | English            | English_MatureBoss                          | Bossy Lady                |
| 21  | English            | English_Debator                             | Male Debater              |
| 22  | English            | English_LovelyGirl                          | Lovely Girl               |
| 23  | English            | English_Steadymentor                        | Reliable Man              |
| 24  | English            | English_Deep-VoicedGentleman                | Deep-voiced Gentleman     |
| 25  | English            | English_Wiselady                            | Wise Lady                 |
| 26  | English            | English_CaptivatingStoryteller              | Captivating Storyteller   |
| 27  | English            | English_DecentYoungMan                      | Decent Young Man          |
| 28  | English            | English_SentimentalLady                     | Sentimental Lady          |
| 29  | English            | English_ImposingManner                      | Imposing Queen            |
| 30  | English            | English_SadTeen                             | Teen Boy                  |
| 31  | English            | English_PassionateWarrior                   | Passionate Warrior        |
| 32  | English            | English_WiseScholar                         | Wise Scholar              |
| 33  | English            | English_Soft-spokenGirl                     | Soft-Spoken Girl          |
| 34  | English            | English_SereneWoman                         | Serene Woman              |
| 35  | English            | English_ConfidentWoman                      | Confident Woman           |
| 36  | English            | English_PatientMan                          | Patient Man               |
| 37  | English            | English_Comedian                            | Comedian                  |
| 38  | English            | English_BossyLeader                         | Bossy Leader              |
| 39  | English            | English_Strong-WilledBoy                    | Strong-Willed Boy         |
| 40  | English            | English_StressedLady                        | Stressed Lady             |
| 41  | English            | English_AssertiveQueen                      | Assertive Queen           |
| 42  | English            | English_AnimeCharacter                      | Female Narrator           |
| 43  | English            | English_Jovialman                           | Jovial Man                |
| 44  | English            | English_WhimsicalGirl                       | Whimsical Girl            |
| 45  | English            | English_Kind-heartedGirl                    | Kind-Hearted Girl         |
| 46  | Chinese (Mandarin) | Chinese (Mandarin)_Reliable_Executive      | Reliable Executive        |
| 47  | Chinese (Mandarin) | Chinese (Mandarin)_News_Anchor             | News Anchor               |
| 48  | Chinese (Mandarin) | Chinese (Mandarin)_Unrestrained_Young_Man | Unrestrained Young Man    |
| 49  | Chinese (Mandarin) | Chinese (Mandarin)_Mature_Woman            | Mature Woman              |
| 50  | Chinese (Mandarin) | Arrogant_Miss                               | Arrogant Miss             |
| 51  | Chinese (Mandarin) | Robot_Armor                                 | Robot Armor               |
| 52  | Chinese (Mandarin) | Chinese (Mandarin)_Kind-hearted_Antie      | Kind-hearted Antie        |
| 53  | Chinese (Mandarin) | Chinese (Mandarin)_HK_Flight_Attendant    | HK Flight Attendant       |
| 54  | Chinese (Mandarin) | Chinese (Mandarin)_Humorous_Elder          | Humorous Elder            |
| 55  | Chinese (Mandarin) | Chinese (Mandarin)_Gentleman                | Gentleman                 |
| 56  | Chinese (Mandarin) | Chinese (Mandarin)_Warm_Bestie             | Warm Bestie               |
| 57  | Chinese (Mandarin) | Chinese (Mandarin)_Stubborn_Friend         | Stubborn Friend           |
| 58  | Chinese (Mandarin) | Chinese (Mandarin)_Sweet_Lady              | Sweet Lady                |
| 59  | Chinese (Mandarin) | Chinese (Mandarin)_Southern_Young_Man     | Southern Young Man        |
| 60  | Chinese (Mandarin) | Chinese (Mandarin)_Wise_Women              | Wise Women                |
| 61  | Chinese (Mandarin) | Chinese (Mandarin)_Gentle_Youth            | Gentle Youth              |
| 62  | Chinese (Mandarin) | Chinese (Mandarin)_Warm_Girl               | Warm Girl                 |
| 63  | Chinese (Mandarin) | Chinese (Mandarin)_Male_Announcer          | Male Announcer            |
| 64  | Chinese (Mandarin) | Chinese (Mandarin)_Kind-hearted_Elder      | Kind-hearted Elder        |
| 65  | Chinese (Mandarin) | Chinese (Mandarin)_Cute_Spirit             | Cute Spirit               |
| 66  | Chinese (Mandarin) | Chinese (Mandarin)_Radio_Host              | Radio Host                |
| 67  | Chinese (Mandarin) | Chinese (Mandarin)_Lyrical_Voice           | Lyrical Voice             |
| 68  | Chinese (Mandarin) | Chinese (Mandarin)_Straightforward_Boy     | Straightforward Boy       |
| 69  | Chinese (Mandarin) | Chinese (Mandarin)_Sincere_Adult           | Sincere Adult             |
| 70  | Chinese (Mandarin) | Chinese (Mandarin)_Gentle_Senior           | Gentle Senior             |
| 71  | Chinese (Mandarin) | Chinese (Mandarin)_Crisp_Girl              | Crisp Girl                |
| 72  | Chinese (Mandarin) | Chinese (Mandarin)_Pure-hearted_Boy        | Pure-hearted Boy          |
| 73  | Chinese (Mandarin) | Chinese (Mandarin)_Soft_Girl               | Soft Girl                 |
| 74  | Chinese (Mandarin) | Chinese (Mandarin)_IntellectualGirl         | Intellectual Girl         |
| 75  | Chinese (Mandarin) | Chinese (Mandarin)_Warm_HeartedGirl        | Warm-hearted Girl         |
| 76  | Chinese (Mandarin) | Chinese (Mandarin)_Laid_BackGirl           | Laid-back Girl            |
| 77  | Chinese (Mandarin) | Chinese (Mandarin)_ExplorativeGirl          | Explorative Girl          |
| 78  | Chinese (Mandarin) | Chinese (Mandarin)_Warm-HeartedAunt         | Warm-hearted Aunt         |
| 79  | Chinese (Mandarin) | Chinese (Mandarin)_BashfulGirl              | Bashful Girl              |
| 80  | Japanese           | Japanese_IntellectualSenior                 | Intellectual Senior       |
| 81  | Japanese           | Japanese_DecisivePrincess                   | Decisive Princess         |
| 82  | Japanese           | Japanese_LoyalKnight                        | Loyal Knight              |
| 83  | Japanese           | Japanese_DominantMan                        | Dominant Man              |
| 84  | Japanese           | Japanese_SeriousCommander                   | Serious Commander         |
| 85  | Japanese           | Japanese_ColdQueen                          | Cold Queen                |
| 86  | Japanese           | Japanese_DependableWoman                    | Dependable Woman          |
| 87  | Japanese           | Japanese_GentleButler                       | Gentle Butler             |
| 88  | Japanese           | Japanese_KindLady                           | Kind Lady                 |
| 89  | Japanese           | Japanese_CalmLady                           | Calm Lady                 |
| 90  | Japanese           | Japanese_OptimisticYouth                    | Optimistic Youth          |
| 91  | Japanese           | Japanese_GenerousIzakayaOwner               | Generous Izakaya Owner    |
| 92  | Japanese           | Japanese_SportyStudent                      | Sporty Student            |
| 93  | Japanese           | Japanese_InnocentBoy                        | Innocent Boy              |
| 94  | Japanese           | Japanese_GracefulMaiden                     | Graceful Maiden           |
| 95  | Cantonese          | Cantonese_ProfessionalHost (F)              | Professional Female Host  |
| 96  | Cantonese          | Cantonese_GentleLady                        | Gentle Lady               |
| 97  | Cantonese          | Cantonese_ProfessionalHost (M)              | Professional Male Host    |
| 98  | Cantonese          | Cantonese_PlayfulMan                        | Playful Man               |
| 99  | Cantonese          | Cantonese_CuteGirl                          | Cute Girl                 |
| 100 | Cantonese          | Cantonese_KindWoman                         | Kind Woman                |
| 101 | Korean             | Korean_AirheadedGirl                        | Airheaded Girl            |
| 102 | Korean             | Korean_AthleticGirl                         | Athletic Girl             |
| 103 | Korean             | Korean_AthleticStudent                      | Athletic Student          |
| 104 | Korean             | Korean_BraveAdventurer                      | Brave Adventurer          |
| 105 | Korean             | Korean_BraveFemaleWarrior                   | Brave Female Warrior      |
| 106 | Korean             | Korean_BraveYouth                           | Brave Youth               |
| 107 | Korean             | Korean_CalmGentleman                        | Calm Gentleman            |
| 108 | Korean             | Korean_CalmLady                             | Calm Lady                 |
| 109 | Korean             | Korean_CaringWoman                          | Caring Woman              |
| 110 | Korean             | Korean_CharmingElderSister                  | Charming Elder Sister     |
| 111 | Korean             | Korean_CharmingSister                       | Charming Sister           |
| 112 | Korean             | Korean_CheerfulBoyfriend                    | Cheerful Boyfriend        |
| 113 | Korean             | Korean_CheerfulCoolJunior                   | Cheerful Cool Junior      |
| 114 | Korean             | Korean_CheerfulLittleSister                 | Cheerful Little Sister    |
| 115 | Korean             | Korean_ChildhoodFriendGirl                  | Childhood Friend Girl     |
| 116 | Korean             | Korean_CockyGuy                             | Cocky Guy                 |
| 117 | Korean             | Korean_ColdGirl                             | Cold Girl                 |
| 118 | Korean             | Korean_ColdYoungMan                         | Cold Young Man            |
| 119 | Korean             | Korean_ConfidentBoss                        | Confident Boss            |
| 120 | Korean             | Korean_ConsiderateSenior                    | Considerate Senior        |
| 121 | Korean             | Korean_DecisiveQueen                        | Decisive Queen            |
| 122 | Korean             | Korean_DominantMan                          | Dominant Man              |
| 123 | Korean             | Korean_ElegantPrincess                      | Elegant Princess          |
| 124 | Korean             | Korean_EnchantingSister                     | Enchanting Sister         |
| 125 | Korean             | Korean_EnthusiasticTeen                     | Enthusiastic Teen         |
| 126 | Korean             | Korean_FriendlyBigSister                    | Friendly Big Sister       |
| 127 | Korean             | Korean_GentleBoss                           | Gentle Boss               |
| 128 | Korean             | Korean_GentleWoman                          | Gentle Woman              |
| 129 | Korean             | Korean_HaughtyLady                          | Haughty Lady              |
| 130 | Korean             | Korean_InnocentBoy                          | Innocent Boy              |
| 131 | Korean             | Korean_IntellectualMan                      | Intellectual Man          |
| 132 | Korean             | Korean_IntellectualSenior                   | Intellectual Senior       |
| 133 | Korean             | Korean_LonelyWarrior                        | Lonely Warrior            |
| 134 | Korean             | Korean_MatureLady                           | Mature Lady               |
| 135 | Korean             | Korean_MysteriousGirl                       | Mysterious Girl           |
| 136 | Korean             | Korean_OptimisticYouth                      | Optimistic Youth          |
| 137 | Korean             | Korean_PlayboyCharmer                       | Playboy Charmer           |
| 138 | Korean             | Korean_PossessiveMan                        | Possessive Man            |
| 139 | Korean             | Korean_QuirkyGirl                           | Quirky Girl               |
| 140 | Korean             | Korean_ReliableSister                       | Reliable Sister           |
| 141 | Korean             | Korean_ReliableYouth                        | Reliable Youth            |
| 142 | Korean             | Korean_SassyGirl                            | Sassy Girl                |
| 143 | Korean             | Korean_ShyGirl                              | Shy Girl                  |
| 144 | Korean             | Korean_SoothingLady                         | Soothing Lady             |
| 145 | Korean             | Korean_StrictBoss                           | Strict Boss               |
| 146 | Korean             | Korean_SweetGirl                            | Sweet Girl                |
| 147 | Korean             | Korean_ThoughtfulWoman                      | Thoughtful Woman          |
| 148 | Korean             | Korean_WiseElf                              | Wise Elf                  |
| 149 | Korean             | Korean_WiseTeacher                          | Wise Teacher              |
| 150 | Spanish            | Spanish_SereneWoman                         | Serene Woman              |
| 151 | Spanish            | Spanish_MaturePartner                       | Mature Partner            |
| 152 | Spanish            | Spanish_CaptivatingStoryteller              | Captivating Storyteller   |
| 153 | Spanish            | Spanish_Narrator                            | Narrator                  |
| 154 | Spanish            | Spanish_WiseScholar                         | Wise Scholar              |
| 155 | Spanish            | Spanish_Kind-heartedGirl                    | Kind-hearted Girl         |
| 156 | Spanish            | Spanish_DeterminedManager                   | Determined Manager        |
| 157 | Spanish            | Spanish_BossyLeader                         | Bossy Leader              |
| 158 | Spanish            | Spanish_ReservedYoungMan                    | Reserved Young Man        |
| 159 | Spanish            | Spanish_ConfidentWoman                      | Confident Woman           |
| 160 | Spanish            | Spanish_ThoughtfulMan                       | Thoughtful Man            |
| 161 | Spanish            | Spanish_Strong-WilledBoy                    | Strong-willed Boy         |
| 162 | Spanish            | Spanish_SophisticatedLady                   | Sophisticated Lady        |
| 163 | Spanish            | Spanish_RationalMan                         | Rational Man              |
| 164 | Spanish            | Spanish_AnimeCharacter                      | Anime Character           |
| 165 | Spanish            | Spanish_Deep-tonedMan                       | Deep-toned Man            |
| 166 | Spanish            | Spanish_Fussyhostess                        | Fussy hostess             |
| 167 | Spanish            | Spanish_SincereTeen                         | Sincere Teen              |
| 168 | Spanish            | Spanish_FrankLady                           | Frank Lady                |
| 169 | Spanish            | Spanish_Comedian                            | Comedian                  |
| 170 | Spanish            | Spanish_Debator                             | Debator                   |
| 171 | Spanish            | Spanish_ToughBoss                           | Tough Boss                |
| 172 | Spanish            | Spanish_Wiselady                            | Wise Lady                 |
| 173 | Spanish            | Spanish_Steadymentor                        | Steady Mentor             |
| 174 | Spanish            | Spanish_Jovialman                           | Jovial Man                |
| 175 | Spanish            | Spanish_SantaClaus                          | Santa Claus               |
| 176 | Spanish            | Spanish_Rudolph                             | Rudolph                   |
| 177 | Spanish            | Spanish_Intonategirl                        | Intonate Girl             |
| 178 | Spanish            | Spanish_Arnold                              | Arnold                    |
| 179 | Spanish            | Spanish_Ghost                               | Ghost                     |
| 180 | Spanish            | Spanish_HumorousElder                       | Humorous Elder            |
| 181 | Spanish            | Spanish_EnergeticBoy                        | Energetic Boy             |
| 182 | Spanish            | Spanish_WhimsicalGirl                       | Whimsical Girl            |
| 183 | Spanish            | Spanish_StrictBoss                          | Strict Boss               |
| 184 | Spanish            | Spanish_ReliableMan                         | Reliable Man              |
| 185 | Spanish            | Spanish_SereneElder                         | Serene Elder              |
| 186 | Spanish            | Spanish_AngryMan                            | Angry Man                 |
| 187 | Spanish            | Spanish_AssertiveQueen                      | Assertive Queen           |
| 188 | Spanish            | Spanish_CaringGirlfriend                    | Caring Girlfriend         |
| 189 | Spanish            | Spanish_PowerfulSoldier                     | Powerful Soldier          |
| 190 | Spanish            | Spanish_PassionateWarrior                   | Passionate Warrior        |
| 191 | Spanish            | Spanish_ChattyGirl                          | Chatty Girl               |
| 192 | Spanish            | Spanish_RomanticHusband                     | Romantic Husband          |
| 193 | Spanish            | Spanish_CompellingGirl                      | Compelling Girl           |
| 194 | Spanish            | Spanish_PowerfulVeteran                     | Powerful Veteran          |
| 195 | Spanish            | Spanish_SensibleManager                     | Sensible Manager          |
| 196 | Spanish            | Spanish_ThoughtfulLady                      | Thoughtful Lady           |
| 197 | Portuguese         | Portuguese_SentimentalLady                  | Sentimental Lady          |
| 198 | Portuguese         | Portuguese_BossyLeader                      | Bossy Leader              |
| 199 | Portuguese         | Portuguese_Wiselady                         | Wise lady                 |
| 200 | Portuguese         | Portuguese_Strong-WilledBoy                 | Strong-willed Boy         |
| 201 | Portuguese         | Portuguese_Deep-VoicedGentleman             | Deep-voiced Gentleman     |
| 202 | Portuguese         | Portuguese_UpsetGirl                        | Upset Girl                |
| 203 | Portuguese         | Portuguese_PassionateWarrior                | Passionate Warrior        |
| 204 | Portuguese         | Portuguese_AnimeCharacter                   | Anime Character           |
| 205 | Portuguese         | Portuguese_ConfidentWoman                   | Confident Woman           |
| 206 | Portuguese         | Portuguese_AngryMan                         | Angry Man                 |
| 207 | Portuguese         | Portuguese_CaptivatingStoryteller           | Captivating Storyteller   |
| 208 | Portuguese         | Portuguese_Godfather                        | Godfather                 |
| 209 | Portuguese         | Portuguese_ReservedYoungMan                 | Reserved Young Man        |
| 210 | Portuguese         | Portuguese_SmartYoungGirl                   | Smart Young Girl          |
| 211 | Portuguese         | Portuguese_Kind-heartedGirl                 | Kind-hearted Girl         |
| 212 | Portuguese         | Portuguese_Pompouslady                      | Pompous lady              |
| 213 | Portuguese         | Portuguese_Grinch                           | Grinch                    |
| 214 | Portuguese         | Portuguese_Debator                          | Debator                   |
| 215 | Portuguese         | Portuguese_SweetGirl                        | Sweet Girl                |
| 216 | Portuguese         | Portuguese_AttractiveGirl                   | Attractive Girl           |
| 217 | Portuguese         | Portuguese_ThoughtfulMan                    | Thoughtful Man            |
| 218 | Portuguese         | Portuguese_PlayfulGirl                      | Playful Girl              |
| 219 | Portuguese         | Portuguese_GorgeousLady                     | Gorgeous Lady             |
| 220 | Portuguese         | Portuguese_LovelyLady                       | Lovely Lady               |
| 221 | Portuguese         | Portuguese_SereneWoman                      | Serene Woman              |
| 222 | Portuguese         | Portuguese_SadTeen                          | Sad Teen                  |
| 223 | Portuguese         | Portuguese_MaturePartner                    | Mature Partner            |
| 224 | Portuguese         | Portuguese_Comedian                         | Comedian                  |
| 225 | Portuguese         | Portuguese_NaughtySchoolgirl                | Naughty Schoolgirl        |
| 226 | Portuguese         | Portuguese_Narrator                         | Narrator                  |
| 227 | Portuguese         | Portuguese_ToughBoss                        | Tough Boss                |
| 228 | Portuguese         | Portuguese_Fussyhostess                     | Fussy hostess             |
| 229 | Portuguese         | Portuguese_Dramatist                        | Dramatist                 |
| 230 | Portuguese         | Portuguese_Steadymentor                     | Steady Mentor             |
| 231 | Portuguese         | Portuguese_Jovialman                        | Jovial Man                |
| 232 | Portuguese         | Portuguese_CharmingQueen                    | Charming Queen            |
| 233 | Portuguese         | Portuguese_SantaClaus                       | Santa Claus               |
| 234 | Portuguese         | Portuguese_Rudolph                          | Rudolph                   |
| 235 | Portuguese         | Portuguese_Arnold                           | Arnold                    |
| 236 | Portuguese         | Portuguese_CharmingSanta                    | Charming Santa            |
| 237 | Portuguese         | Portuguese_CharmingLady                     | Charming Lady             |
| 238 | Portuguese         | Portuguese_Ghost                            | Ghost                     |
| 239 | Portuguese         | Portuguese_HumorousElder                    | Humorous Elder            |
| 240 | Portuguese         | Portuguese_CalmLeader                       | Calm Leader               |
| 241 | Portuguese         | Portuguese_GentleTeacher                    | Gentle Teacher            |
| 242 | Portuguese         | Portuguese_EnergeticBoy                     | Energetic Boy             |
| 243 | Portuguese         | Portuguese_ReliableMan                      | Reliable Man              |
| 244 | Portuguese         | Portuguese_SereneElder                      | Serene Elder              |
| 245 | Portuguese         | Portuguese_GrimReaper                       | Grim Reaper               |
| 246 | Portuguese         | Portuguese_AssertiveQueen                   | Assertive Queen           |
| 247 | Portuguese         | Portuguese_WhimsicalGirl                    | Whimsical Girl            |
| 248 | Portuguese         | Portuguese_StressedLady                     | Stressed Lady             |
| 249 | Portuguese         | Portuguese_FriendlyNeighbor                 | Friendly Neighbor         |
| 250 | Portuguese         | Portuguese_CaringGirlfriend                 | Caring Girlfriend         |
| 251 | Portuguese         | Portuguese_PowerfulSoldier                  | Powerful Soldier          |
| 252 | Portuguese         | Portuguese_FascinatingBoy                   | Fascinating Boy           |
| 253 | Portuguese         | Portuguese_RomanticHusband                  | Romantic Husband          |
| 254 | Portuguese         | Portuguese_StrictBoss                       | Strict Boss               |
| 255 | Portuguese         | Portuguese_InspiringLady                    | Inspiring Lady            |
| 256 | Portuguese         | Portuguese_PlayfulSpirit                    | Playful Spirit            |
| 257 | Portuguese         | Portuguese_ElegantGirl                      | Elegant Girl              |
| 258 | Portuguese         | Portuguese_CompellingGirl                   | Compelling Girl           |
| 259 | Portuguese         | Portuguese_PowerfulVeteran                  | Powerful Veteran          |
| 260 | Portuguese         | Portuguese_SensibleManager                  | Sensible Manager          |
| 261 | Portuguese         | Portuguese_ThoughtfulLady                   | Thoughtful Lady           |
| 262 | Portuguese         | Portuguese_TheatricalActor                  | Theatrical Actor          |
| 263 | Portuguese         | Portuguese_FragileBoy                       | Fragile Boy               |
| 264 | Portuguese         | Portuguese_ChattyGirl                       | Chatty Girl               |
| 265 | Portuguese         | Portuguese_Conscientiousinstructor          | Conscientious Instructor  |
| 266 | Portuguese         | Portuguese_RationalMan                      | Rational Man              |
| 267 | Portuguese         | Portuguese_WiseScholar                      | Wise Scholar              |
| 268 | Portuguese         | Portuguese_FrankLady                        | Frank Lady                |
| 269 | Portuguese         | Portuguese_DeterminedManager                | Determined Manager        |
| 270 | French             | French_Male_Speech_New                      | Level-Headed Man          |
| 271 | French             | French_Female_News Anchor                  | Patient Female Presenter  |
| 272 | French             | French_CasualMan                            | Casual Man                |
| 273 | French             | French_MovieLeadFemale                      | Movie Lead Female         |
| 274 | French             | French_FemaleAnchor                         | Female Anchor             |
| 275 | French             | French_MaleNarrator                         | Male Narrator             |
| 276 | Indonesian         | Indonesian_SweetGirl                        | Sweet Girl                |
| 277 | Indonesian         | Indonesian_ReservedYoungMan                 | Reserved Young Man        |
| 278 | Indonesian         | Indonesian_CharmingGirl                     | Charming Girl             |
| 279 | Indonesian         | Indonesian_CalmWoman                        | Calm Woman                |
| 280 | Indonesian         | Indonesian_ConfidentWoman                   | Confident Woman           |
| 281 | Indonesian         | Indonesian_CaringMan                        | Caring Man                |
| 282 | Indonesian         | Indonesian_BossyLeader                      | Bossy Leader              |
| 283 | Indonesian         | Indonesian_DeterminedBoy                    | Determined Boy            |
| 284 | Indonesian         | Indonesian_GentleGirl                       | Gentle Girl               |
| 285 | German             | German_FriendlyMan                          | Friendly Man              |
| 286 | German             | German_SweetLady                            | Sweet Lady                |
| 287 | German             | German_PlayfulMan                           | Playful Man               |
| 288 | Russian            | Russian_HandsomeChildhoodFriend             | Handsome Childhood Friend |
| 289 | Russian            | Russian_BrightHeroine                       | Bright Queen              |
| 290 | Russian            | Russian_AmbitiousWoman                      | Ambitious Woman           |
| 291 | Russian            | Russian_ReliableMan                         | Reliable Man              |
| 292 | Russian            | Russian_CrazyQueen                          | Crazy Girl                |
| 293 | Russian            | Russian_PessimisticGirl                     | Pessimistic Girl          |
| 294 | Russian            | Russian_AttractiveGuy                       | Attractive Guy            |
| 295 | Russian            | Russian_Bad-temperedBoy                     | Bad-tempered Boy          |
| 296 | Italian            | Italian_BraveHeroine                        | Brave Heroine             |
| 297 | Italian            | Italian_Narrator                            | Narrator                  |
| 298 | Italian            | Italian_WanderingSorcerer                   | Wandering Sorcerer        |
| 299 | Italian            | Italian_DiligentLeader                      | Diligent Leader           |
| 300 | Dutch              | Dutch_kindhearted_girl                     | Kind-hearted girl         |
| 301 | Dutch              | Dutch_bossy_leader                         | Bossy leader              |
| 302 | Vietnamese         | Vietnamese_kindhearted_girl                | Kind-hearted girl         |
| 303 | Arabic             | Arabic_CalmWoman                            | Calm Woman                |
| 304 | Arabic             | Arabic_FriendlyGuy                          | Friendly Guy              |
| 305 | Turkish            | Turkish_CalmWoman                           | Calm Woman                |
| 306 | Turkish            | Turkish_Trustworthyman                      | Trustworthy man           |
| 307 | Ukrainian          | Ukrainian_CalmWoman                         | Calm Woman                |
| 308 | Ukrainian          | Ukrainian_WiseScholar                       | Wise Scholar              |
| 309 | Thai               | Thai_male_1_sample8                         | Serene Man                |
| 310 | Thai               | Thai_male_2_sample2                         | Friendly Man              |
| 311 | Thai               | Thai_female_1_sample1                       | Confident Woman           |
| 312 | Thai               | Thai_female_2_sample2                       | Energetic Woman           |
| 313 | Polish             | Polish_male_1_sample4                       | Male Narrator             |
| 314 | Polish             | Polish_male_2_sample3                       | Male Anchor               |
| 315 | Polish             | Polish_female_1_sample1                     | Calm Woman                |
| 316 | Polish             | Polish_female_2_sample3                     | Casual Woman              |
| 317 | Romanian           | Romanian_male_1_sample2                     | Reliable Man              |
| 318 | Romanian           | Romanian_male_2_sample1                     | Energetic Youth           |
| 319 | Romanian           | Romanian_female_1_sample4                   | Optimistic Youth          |
| 320 | Romanian           | Romanian_female_2_sample1                   | Gentle Woman              |
| 321 | Greek              | greek_male_1a_v1                            | Thoughtful Mentor         |
| 322 | Greek              | Greek_female_1_sample1                      | Gentle Lady               |
| 323 | Greek              | Greek_female_2_sample3                      | Girl Next Door            |
| 324 | Czech              | czech_male_1_v1                             | Assured Presenter         |
| 325 | Czech              | czech_female_5_v7                           | Steadfast Narrator        |
| 326 | Czech              | czech_female_2_v2                           | Elegant Lady              |
| 327 | Finnish            | finnish_male_3_v1                           | Upbeat Man                |
| 328 | Finnish            | finnish_male_1_v2                           | Friendly Boy              |
| 329 | Finnish            | finnish_female_4_v1                         | Assetive Woman            |
| 330 | Hindi              | hindi_male_1_v2                             | Trustworthy Advisor       |
| 331 | Hindi              | hindi_female_2_v1                           | Tranquil Woman            |
| 332 | Hindi              | hindi_female_1_v2                           | News Anchor               |
`;

const MINIMAX_VOICE_DEFINITIONS: MinimaxVoiceDefinition[] = RAW_MINIMAX_VOICE_TABLE.split("\n")
  .map((line) => line.trim())
  .filter((line) => line.startsWith("|"))
  .map((line) => line.split("|").map((part) => part.trim()).filter(Boolean))
  .filter((parts) => parts.length >= 4 && parts[0] !== "No.")
  .map((parts) => ({
    language: parts[1],
    voiceId: parts[2],
    voiceName: parts[3],
  }));

export const MINIMAX_VOICE_OPTIONS: VoiceOption[] = MINIMAX_VOICE_DEFINITIONS.map(
  (definition) => ({
    id: definition.voiceId,
    name: definition.voiceName,
    language: definition.language,
    provider: "minimax",
    isPremium: true,
  }),
);

export const MINIMAX_LANGUAGES: string[] = Array.from(
  new Set(MINIMAX_VOICE_DEFINITIONS.map((voice) => voice.language)),
);
