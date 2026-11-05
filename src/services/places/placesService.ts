import type { LocationPoint, IPlacesProvider } from '../../types/routing';

const INDIAN_PLACES_DATABASE: LocationPoint[] = [
  // =========================================================================
  // MAHARASHTRA: MUMBAI METROPOLITAN REGION (MMR) & COASTAL
  // =========================================================================
  { name: 'Bandra West, Mumbai', address: 'Bandra West, Mumbai, Maharashtra', lat: 19.0596, lng: 72.8295 },
  { name: 'Bandra Kurla Complex (BKC), Mumbai', address: 'BKC, Bandra East, Mumbai, Maharashtra', lat: 19.0664, lng: 72.8687 },
  { name: 'Andheri East, Mumbai', address: 'Andheri East, Mumbai, Maharashtra', lat: 19.1136, lng: 72.8697 },
  { name: 'Andheri West / Lokhandwala, Mumbai', address: 'Andheri West, Mumbai, Maharashtra', lat: 19.1363, lng: 72.8277 },
  { name: 'CSMIA Terminal 2 (T2), Mumbai', address: 'Chhatrapati Shivaji Maharaj International Airport, Mumbai', lat: 19.0968, lng: 72.8727 },
  { name: 'CSMIA Terminal 1 (T1 Domestic), Mumbai', address: 'Domestic Airport, Vile Parle, Mumbai, Maharashtra', lat: 19.0886, lng: 72.8535 },
  { name: 'Nariman Point, South Mumbai', address: 'Nariman Point, Churchgate, Mumbai, Maharashtra', lat: 18.9256, lng: 72.8242 },
  { name: 'Marine Drive / Churchgate, Mumbai', address: 'Marine Drive, Mumbai, Maharashtra', lat: 18.9322, lng: 72.8264 },
  { name: 'Chhatrapati Shivaji Maharaj Terminus (CSMT), Mumbai', address: 'Fort, Mumbai, Maharashtra', lat: 18.9401, lng: 72.8354 },
  { name: 'Dadar TT Circle / Shivaji Park, Mumbai', address: 'Dadar West, Mumbai, Maharashtra', lat: 19.0178, lng: 72.8478 },
  { name: 'Worli Sea Face / Bandra-Worli Sea Link', address: 'Worli, Mumbai, Maharashtra', lat: 19.0135, lng: 72.8153 },
  { name: 'Chembur / Eastern Freeway, Mumbai', address: 'Chembur, Mumbai, Maharashtra', lat: 19.0522, lng: 72.8994 },
  { name: 'Powai / Hiranandani & IIT Bombay', address: 'Powai, Mumbai, Maharashtra', lat: 19.1176, lng: 72.9060 },
  { name: 'Borivali West / SGNP, Mumbai', address: 'Borivali West, Mumbai, Maharashtra', lat: 19.2307, lng: 72.8567 },
  { name: 'Goregaon East (Aarey / Film City)', address: 'Goregaon East, Mumbai, Maharashtra', lat: 19.1663, lng: 72.8526 },
  { name: 'Ghatkopar East / Metro Hub', address: 'Ghatkopar East, Mumbai, Maharashtra', lat: 19.0860, lng: 72.9090 },
  { name: 'Mulund West / LBS Marg', address: 'Mulund West, Mumbai, Maharashtra', lat: 19.1726, lng: 72.9565 },
  { name: 'Thane West (Viviana Mall & Majiwada)', address: 'Thane West, Thane, Maharashtra', lat: 19.2183, lng: 72.9781 },
  { name: 'Ghodbunder Road, Thane', address: 'Ghodbunder Road, Thane, Maharashtra', lat: 19.2618, lng: 72.9642 },
  { name: 'Vashi, Navi Mumbai', address: 'Vashi, Navi Mumbai, Maharashtra', lat: 19.0771, lng: 72.9986 },
  { name: 'Belapur CBD, Navi Mumbai', address: 'CBD Belapur, Navi Mumbai, Maharashtra', lat: 19.0178, lng: 73.0416 },
  { name: 'Kharghar, Navi Mumbai', address: 'Kharghar, Navi Mumbai, Maharashtra', lat: 19.0473, lng: 73.0699 },
  { name: 'Panvel / Kalamboli Junction (Expressway Zero Point)', address: 'Panvel, Raigad, Maharashtra', lat: 18.9894, lng: 73.1175 },
  { name: 'Navi Mumbai International Airport (NMIA Site)', address: 'Ulwe, Navi Mumbai, Maharashtra', lat: 18.9898, lng: 73.0683 },
  { name: 'Atal Setu (MTHL) Sewri Entry', address: 'Sewri, Mumbai, Maharashtra', lat: 18.9986, lng: 72.8544 },
  { name: 'Atal Setu (MTHL) Chirle Exit', address: 'Chirle, Uran, Raigad, Maharashtra', lat: 18.9056, lng: 72.9982 },
  { name: 'Kalyan Station West', address: 'Kalyan, Thane District, Maharashtra', lat: 19.2437, lng: 73.1355 },
  { name: 'Dombivli East (MIDC)', address: 'Dombivli East, Thane District, Maharashtra', lat: 19.2184, lng: 73.0867 },
  { name: 'Mira Road / Bhayandar', address: 'Mira Bhayandar, Thane District, Maharashtra', lat: 19.2812, lng: 72.8561 },
  { name: 'Vasai West', address: 'Vasai, Palghar District, Maharashtra', lat: 19.3919, lng: 72.8397 },
  { name: 'Virar West', address: 'Virar, Palghar District, Maharashtra', lat: 19.4564, lng: 72.8081 },
  { name: 'Palghar City', address: 'Palghar District Headquarters, Maharashtra', lat: 19.6967, lng: 72.7699 },
  { name: 'Dahanu Beach & Bordi', address: 'Dahanu, Palghar District, Maharashtra', lat: 19.9723, lng: 72.7317 },

  // =========================================================================
  // MAHARASHTRA: PUNE & PIMPRI-CHINCHWAD (PCMC)
  // =========================================================================
  { name: 'Shivajinagar, Pune', address: 'Shivajinagar, Pune, Maharashtra', lat: 18.5314, lng: 73.8446 },
  { name: 'Koregaon Park, Pune', address: 'Koregaon Park, Pune, Maharashtra', lat: 18.5362, lng: 73.8940 },
  { name: 'Kothrud / Chandani Chowk, Pune', address: 'Kothrud, Pune, Maharashtra', lat: 18.5074, lng: 73.8077 },
  { name: 'Deccan Gymkhana / FC Road, Pune', address: 'Deccan Gymkhana, Pune, Maharashtra', lat: 18.5173, lng: 73.8415 },
  { name: 'Swargate Bus Station, Pune', address: 'Swargate, Pune, Maharashtra', lat: 18.5018, lng: 73.8586 },
  { name: 'Katraj / Snake Park & Tunnel, Pune', address: 'Katraj, Pune, Maharashtra', lat: 18.4529, lng: 73.8553 },
  { name: 'Hinjawadi Phase 1 (Rajiv Gandhi Infotech Park), Pune', address: 'Hinjawadi, Pune, Maharashtra', lat: 18.5913, lng: 73.7389 },
  { name: 'Hinjawadi Phase 3 (Megapolis), Pune', address: 'Hinjawadi Phase 3, Pune, Maharashtra', lat: 18.5772, lng: 73.6894 },
  { name: 'Wakad / Datta Mandir Road, Pune', address: 'Wakad, Pimpri-Chinchwad, Pune, Maharashtra', lat: 18.5987, lng: 73.7688 },
  { name: 'Baner / High Street, Pune', address: 'Baner, Pune, Maharashtra', lat: 18.5590, lng: 73.7868 },
  { name: 'Balewadi Sports Complex (Shiv Chhatrapati), Pune', address: 'Balewadi, Pune, Maharashtra', lat: 18.5750, lng: 73.7725 },
  { name: 'Viman Nagar / Pune Airport (PNQ)', address: 'Viman Nagar, Pune, Maharashtra', lat: 18.5679, lng: 73.9143 },
  { name: 'Kharadi (EON Free Zone / WTC), Pune', address: 'Kharadi, Pune, Maharashtra', lat: 18.5515, lng: 73.9535 },
  { name: 'Hadapsar / Magarpatta City, Pune', address: 'Hadapsar, Pune, Maharashtra', lat: 18.5089, lng: 73.9259 },
  { name: 'Pimpri / PCMC Municipal Bhavan', address: 'Pimpri, Pimpri-Chinchwad, Maharashtra', lat: 18.6298, lng: 73.7997 },
  { name: 'Chinchwad Station / Elpro City Square', address: 'Chinchwad, Pune, Maharashtra', lat: 18.6369, lng: 73.7844 },
  { name: 'Bhosari MIDC, Pune', address: 'Bhosari, PCMC, Pune, Maharashtra', lat: 18.6279, lng: 73.8475 },
  { name: 'Chakan Automobile MIDC Hub', address: 'Chakan, Pune District, Maharashtra', lat: 18.7606, lng: 73.8569 },
  { name: 'Talegaon Dabhade (Expressway Exit)', address: 'Talegaon Dabhade, Pune District, Maharashtra', lat: 18.7351, lng: 73.6749 },
  { name: 'Baramati MIDC & City', address: 'Baramati, Pune District, Maharashtra', lat: 18.1517, lng: 74.5772 },

  // =========================================================================
  // MAHARASHTRA: WESTERN MAHARASHTRA (PASCHIM MAHARASHTRA)
  // =========================================================================
  { name: 'Satara City (Powai Naka)', address: 'Satara District Headquarters, Maharashtra', lat: 17.6805, lng: 73.9930 },
  { name: 'Kaas Plateau (Valley of Flowers), Satara', address: 'Kaas Pathar, Satara, Maharashtra', lat: 17.7214, lng: 73.8211 },
  { name: 'Karad City & Taswade Toll (NH 48)', address: 'Karad, Satara District, Maharashtra', lat: 17.2885, lng: 74.1844 },
  { name: 'Shirwal Industrial Corridor (NH 48)', address: 'Shirwal, Satara District, Maharashtra', lat: 18.1345, lng: 73.9877 },
  { name: 'Wai (Ganpati Mandir & Krishna Ghat)', address: 'Wai, Satara District, Maharashtra', lat: 17.9482, lng: 73.8920 },
  { name: 'Kolhapur Central (Kawala Naka & Station)', address: 'Kolhapur District Headquarters, Maharashtra', lat: 16.7050, lng: 74.2433 },
  { name: 'Shri Mahalakshmi (Ambabai) Temple, Kolhapur', address: 'Bhavani Mandap, Kolhapur, Maharashtra', lat: 16.6944, lng: 74.2238 },
  { name: 'Shiroli MIDC / Kolhapur Highway Entry (NH 48)', address: 'Shiroli, Kolhapur, Maharashtra', lat: 16.7458, lng: 74.2798 },
  { name: 'Ichalkaranji (Manchester of Maharashtra)', address: 'Ichalkaranji, Kolhapur District, Maharashtra', lat: 16.6967, lng: 74.4644 },
  { name: 'Panhala Fort, Kolhapur', address: 'Panhala, Kolhapur District, Maharashtra', lat: 16.8118, lng: 74.1102 },
  { name: 'Sangli City (Ganpati Peth & Station)', address: 'Sangli District Headquarters, Maharashtra', lat: 16.8524, lng: 74.5815 },
  { name: 'Miraj Junction & Medical Complex', address: 'Miraj, Sangli District, Maharashtra', lat: 16.8286, lng: 74.6467 },
  { name: 'Solapur City (Navi Peth & Railway Station)', address: 'Solapur District Headquarters, Maharashtra', lat: 17.6599, lng: 75.9064 },
  { name: 'Siddheshwar Mandir, Solapur', address: 'Siddheshwar Lake, Solapur, Maharashtra', lat: 17.6715, lng: 75.9102 },
  { name: 'Pandharpur (Shri Vitthal Rukmini Mandir)', address: 'Pandharpur, Solapur District, Maharashtra', lat: 17.6775, lng: 75.3249 },
  { name: 'Akkalkot (Swami Samarth Maharaj Mandir)', address: 'Akkalkot, Solapur District, Maharashtra', lat: 17.5256, lng: 76.2052 },

  // =========================================================================
  // MAHARASHTRA: NORTH MAHARASHTRA & KHANDESH
  // =========================================================================
  { name: 'Dwarka Circle, Nashik', address: 'Dwarka, Nashik, Maharashtra', lat: 19.9975, lng: 73.7898 },
  { name: 'Panchavati & Ramkund, Nashik', address: 'Panchavati, Nashik, Maharashtra', lat: 20.0063, lng: 73.7932 },
  { name: 'College Road / Gangapur Road, Nashik', address: 'Nashik West, Maharashtra', lat: 20.0102, lng: 73.7634 },
  { name: 'Satpur MIDC & Ambad, Nashik', address: 'Satpur, Nashik, Maharashtra', lat: 19.9806, lng: 73.7389 },
  { name: 'Shri Trimbakeshwar Jyotirlinga Temple, Nashik', address: 'Trimbak, Nashik District, Maharashtra', lat: 19.9325, lng: 73.5307 },
  { name: 'Sinnar Industrial Zone (Samruddhi Mahamarg Interchange)', address: 'Sinnar, Nashik District, Maharashtra', lat: 19.8456, lng: 74.0049 },
  { name: 'Malegaon City & Mosam River', address: 'Malegaon, Nashik District, Maharashtra', lat: 20.5539, lng: 74.5298 },
  { name: 'Dhule City (Agra Highway NH 52/53)', address: 'Dhule District Headquarters, Maharashtra', lat: 20.9042, lng: 74.7749 },
  { name: 'Jalgaon Central (Gold Market & Court Road)', address: 'Jalgaon District Headquarters, Maharashtra', lat: 21.0077, lng: 75.5626 },
  { name: 'Bhusawal Railway Junction', address: 'Bhusawal, Jalgaon District, Maharashtra', lat: 21.0456, lng: 75.7865 },
  { name: 'Nandurbar City', address: 'Nandurbar District Headquarters, Maharashtra', lat: 21.3697, lng: 74.2389 },
  { name: 'Toranmal Hill Station & Sita Khai', address: 'Toranmal, Nandurbar District, Maharashtra', lat: 21.8744, lng: 74.4539 },
  { name: 'Ahmednagar / Ahilyanagar (Savedi & Fort)', address: 'Ahilyanagar District Headquarters, Maharashtra', lat: 19.0952, lng: 74.7480 },
  { name: 'Shri Saibaba Sansthan Temple, Shirdi', address: 'Shirdi, Rahata, Ahmednagar, Maharashtra', lat: 19.7667, lng: 74.4764 },
  { name: 'Shani Shingnapur (Shani Dev Mandir)', address: 'Nevasa, Ahmednagar District, Maharashtra', lat: 19.3872, lng: 74.8219 },
  { name: 'Sangamner Bypass (NH 60)', address: 'Sangamner, Ahmednagar District, Maharashtra', lat: 19.5772, lng: 74.2155 },

  // =========================================================================
  // MAHARASHTRA: MARATHWADA
  // =========================================================================
  { name: 'Chhatrapati Sambhajinagar (Aurangabad Central / Kranti Chowk)', address: 'Chhatrapati Sambhajinagar Headquarters, Maharashtra', lat: 19.8762, lng: 75.3433 },
  { name: 'CIDCO / Prozone Mall, Chhatrapati Sambhajinagar', address: 'CIDCO, Sambhajinagar, Maharashtra', lat: 19.8789, lng: 75.3712 },
  { name: 'Shri Grishneshwar Jyotirlinga & Ellora Caves', address: 'Verul, Khuldabad, Sambhajinagar, Maharashtra', lat: 20.0247, lng: 75.1706 },
  { name: 'Ajanta Caves (UNESCO World Heritage Site)', address: 'Lenapur, Sillod, Sambhajinagar, Maharashtra', lat: 20.5519, lng: 75.7033 },
  { name: 'Daulatabad (Devagiri) Fort', address: 'Daulatabad, Sambhajinagar, Maharashtra', lat: 19.9431, lng: 75.2136 },
  { name: 'Jalna City (Steel City & Samruddhi Exit)', address: 'Jalna District Headquarters, Maharashtra', lat: 19.8410, lng: 75.8864 },
  { name: 'Beed City', address: 'Beed District Headquarters, Maharashtra', lat: 18.9891, lng: 75.7601 },
  { name: 'Parli Vaijnath Jyotirlinga Temple', address: 'Parli, Beed District, Maharashtra', lat: 18.8504, lng: 76.5366 },
  { name: 'Latur City (Ganj Golai & Station)', address: 'Latur District Headquarters, Maharashtra', lat: 18.4088, lng: 76.5604 },
  { name: 'Dharashiv / Osmanabad City', address: 'Dharashiv District Headquarters, Maharashtra', lat: 18.1856, lng: 76.0419 },
  { name: 'Shri Tulja Bhavani Temple, Tuljapur', address: 'Tuljapur, Dharashiv District, Maharashtra', lat: 18.0062, lng: 76.0827 },
  { name: 'Nanded (Hazur Sahib Sachkhand Gurudwara)', address: 'Nanded District Headquarters, Maharashtra', lat: 19.1528, lng: 77.3189 },
  { name: 'Parbhani City', address: 'Parbhani District Headquarters, Maharashtra', lat: 19.2686, lng: 76.7708 },
  { name: 'Hingoli City', address: 'Hingoli District Headquarters, Maharashtra', lat: 19.7189, lng: 77.1472 },
  { name: 'Aundha Nagnath Jyotirlinga Temple', address: 'Aundha Nagnath, Hingoli District, Maharashtra', lat: 19.5397, lng: 77.0422 },

  // =========================================================================
  // MAHARASHTRA: VIDARBHA (NAGPUR & AMRAVATI DIVISIONS)
  // =========================================================================
  { name: 'Zero Mile Marker & Sitabuldi, Nagpur', address: 'Nagpur Central, Maharashtra', lat: 21.1458, lng: 79.0882 },
  { name: 'Dharampeth / Ramdaspeth, Nagpur', address: 'Nagpur West, Maharashtra', lat: 21.1439, lng: 79.0651 },
  { name: 'MIHAN SEZ & Butibori (Samruddhi Mahamarg Zero Point)', address: 'Butibori, Nagpur, Maharashtra', lat: 20.9256, lng: 78.9882 },
  { name: 'Dr. Babasaheb Ambedkar International Airport (NAG)', address: 'Sonegaon, Nagpur, Maharashtra', lat: 21.0922, lng: 79.0472 },
  { name: 'Deekshabhoomi, Nagpur', address: 'Ramdaspeth, Nagpur, Maharashtra', lat: 21.1278, lng: 79.0672 },
  { name: 'Wardha City & Samruddhi Mahamarg Interchange', address: 'Wardha District Headquarters, Maharashtra', lat: 20.7453, lng: 78.6022 },
  { name: 'Sewagram Ashram, Wardha', address: 'Sewagram, Wardha District, Maharashtra', lat: 20.7139, lng: 78.6533 },
  { name: 'Rajkamal Chowk, Amravati', address: 'Amravati District Headquarters, Maharashtra', lat: 20.9320, lng: 77.7523 },
  { name: 'Chikhaldara Hill Station (Melghat Tiger Reserve)', address: 'Chikhaldara, Amravati District, Maharashtra', lat: 21.4019, lng: 77.3278 },
  { name: 'Akola City (Tower Chowk & Civil Lines)', address: 'Akola District Headquarters, Maharashtra', lat: 20.7002, lng: 77.0082 },
  { name: 'Shegaon (Shri Sant Gajanan Maharaj Sansthan)', address: 'Shegaon, Buldhana District, Maharashtra', lat: 20.7933, lng: 76.6944 },
  { name: 'Buldhana City', address: 'Buldhana District Headquarters, Maharashtra', lat: 20.5292, lng: 76.1844 },
  { name: 'Lonar Meteor Crater & Lake', address: 'Lonar, Buldhana District, Maharashtra', lat: 19.9758, lng: 76.5081 },
  { name: 'Washim City & Balaji Mandir', address: 'Washim District Headquarters, Maharashtra', lat: 20.1111, lng: 77.1333 },
  { name: 'Karanja Lad (Samruddhi Mahamarg Interchange)', address: 'Karanja, Washim District, Maharashtra', lat: 20.4833, lng: 77.4833 },
  { name: 'Yavatmal City (Darwha Road)', address: 'Yavatmal District Headquarters, Maharashtra', lat: 20.3888, lng: 78.1204 },
  { name: 'Chandrapur Central (Gandhi Chowk)', address: 'Chandrapur District Headquarters, Maharashtra', lat: 19.9615, lng: 79.2961 },
  { name: 'Tadoba-Andhari Tiger Reserve (Moharli Gate)', address: 'Moharli, Chandrapur District, Maharashtra', lat: 20.1697, lng: 79.3144 },
  { name: 'Bhandara City', address: 'Bhandara District Headquarters, Maharashtra', lat: 21.1714, lng: 79.6542 },
  { name: 'Gondia City', address: 'Gondia District Headquarters, Maharashtra', lat: 21.4608, lng: 80.1961 },
  { name: 'Gadchiroli City', address: 'Gadchiroli District Headquarters, Maharashtra', lat: 20.1833, lng: 80.0000 },

  // =========================================================================
  // MAHARASHTRA: HILL STATIONS, NATURE & PILGRIMAGE RETREATS
  // =========================================================================
  { name: 'Lonavala & Khandala (Tiger Point / Bhushi Dam)', address: 'Lonavala, Pune District, Maharashtra', lat: 18.7557, lng: 73.4091 },
  { name: 'Khandala Ghat & Sunset Point', address: 'Khandala, Pune District, Maharashtra', lat: 18.7562, lng: 73.3742 },
  { name: 'Mahabaleshwar (Mapro Garden & Venna Lake)', address: 'Mahabaleshwar, Satara District, Maharashtra', lat: 17.9237, lng: 73.6586 },
  { name: 'Arthur’s Seat & Old Mahabaleshwar Temple', address: 'Mahabaleshwar, Satara District, Maharashtra', lat: 17.9839, lng: 73.6186 },
  { name: 'Panchgani (Table Land & Sydney Point)', address: 'Panchgani, Satara District, Maharashtra', lat: 17.9256, lng: 73.8017 },
  { name: 'Matheran Hill Station (Dasturi Naka & Aman Lodge)', address: 'Matheran, Raigad District, Maharashtra', lat: 18.9867, lng: 73.2725 },
  { name: 'Igatpuri (Kasara Ghat Mist & Vipassana Centre)', address: 'Igatpuri, Nashik District, Maharashtra', lat: 19.6967, lng: 73.5614 },
  { name: 'Bhandardara (Arthur Lake & Wilson Dam)', address: 'Bhandardara, Akole, Ahmednagar, Maharashtra', lat: 19.5442, lng: 73.7547 },
  { name: 'Lavasa Hill City (Dasve Promenade)', address: 'Lavasa, Mulshi, Pune District, Maharashtra', lat: 18.4098, lng: 73.5094 },
  { name: 'Mulshi Dam & Tamhini Ghat', address: 'Mulshi, Pune District, Maharashtra', lat: 18.5089, lng: 73.5160 },
  { name: 'Bhimashankar Jyotirlinga & Wildlife Sanctuary', address: 'Bhimashankar, Khed, Pune, Maharashtra', lat: 19.0722, lng: 73.5358 },
  { name: 'Jawhar Hill Station & Jai Vilas Palace', address: 'Jawhar, Palghar District, Maharashtra', lat: 19.9167, lng: 73.2333 },
  { name: 'Amboli Hill Station & Waterfalls', address: 'Amboli, Sawantwadi, Sindhudurg, Maharashtra', lat: 15.9606, lng: 73.9989 },
  { name: 'Alandi (Sant Dnyaneshwar Maharaj Samadhi)', address: 'Alandi, Khed, Pune, Maharashtra', lat: 18.6769, lng: 73.8967 },
  { name: 'Dehu (Sant Tukaram Maharaj Temple)', address: 'Dehu, Haveli, Pune, Maharashtra', lat: 18.7183, lng: 73.7686 },
  { name: 'Morgaon Mayureshwar (First Ashtavinayak)', address: 'Morgaon, Baramati, Pune, Maharashtra', lat: 18.2758, lng: 74.3164 },
  { name: 'Theur Chintamani (Ashtavinayak)', address: 'Theur, Haveli, Pune, Maharashtra', lat: 18.5286, lng: 74.0539 },
  { name: 'Siddhatek Siddhivinayak (Ashtavinayak)', address: 'Siddhatek, Karjat, Ahmednagar, Maharashtra', lat: 18.3417, lng: 74.9667 },
  { name: 'Ranjangaon Mahaganapati (Ashtavinayak & MIDC)', address: 'Ranjangaon, Shirur, Pune, Maharashtra', lat: 18.7556, lng: 74.2417 },
  { name: 'Ozar Vighnahar (Ashtavinayak)', address: 'Ozar, Junnar, Pune, Maharashtra', lat: 19.1917, lng: 73.9556 },
  { name: 'Lenyadri Girijatmaj (Ashtavinayak Cave Temple)', address: 'Lenyadri, Junnar, Pune, Maharashtra', lat: 19.2392, lng: 73.8894 },
  { name: 'Mahad Varadvinayak (Ashtavinayak, Khopoli)', address: 'Mahad, Khalapur, Raigad, Maharashtra', lat: 18.8258, lng: 73.3039 },
  { name: 'Pali Ballaleshwar (Ashtavinayak)', address: 'Pali, Sudhagad, Raigad, Maharashtra', lat: 18.5367, lng: 73.2197 },

  // =========================================================================
  // MAHARASHTRA: KONKAN BEACHES & COASTAL GETAWAYS
  // =========================================================================
  { name: 'Alibaug Beach & Kolaba Fort', address: 'Alibaug, Raigad District, Maharashtra', lat: 18.6414, lng: 72.8722 },
  { name: 'Varsoli Beach, Alibaug', address: 'Varsoli, Alibaug, Raigad, Maharashtra', lat: 18.6653, lng: 72.8686 },
  { name: 'Nagaon & Akshi Beach, Alibaug', address: 'Nagaon, Raigad District, Maharashtra', lat: 18.5861, lng: 72.9064 },
  { name: 'Mandwa Jetty (Ro-Pax Ferry Terminal)', address: 'Mandwa, Alibaug, Raigad, Maharashtra', lat: 18.7997, lng: 72.8739 },
  { name: 'Kashid White Sand Beach', address: 'Kashid, Murud, Raigad, Maharashtra', lat: 18.4414, lng: 72.9067 },
  { name: 'Murud-Janjira Sea Fort', address: 'Murud, Raigad District, Maharashtra', lat: 18.3006, lng: 72.9633 },
  { name: 'Diveagar Beach', address: 'Diveagar, Shrivardhan, Raigad, Maharashtra', lat: 18.1722, lng: 73.0039 },
  { name: 'Harihareshwar (Dakshin Kashi & Beach)', address: 'Harihareshwar, Raigad District, Maharashtra', lat: 17.9947, lng: 73.0239 },
  { name: 'Pen City & Vadkhal Junction', address: 'Pen, Raigad District, Maharashtra', lat: 18.7369, lng: 73.0931 },
  { name: 'Mangaon Highway Market (NH 66)', address: 'Mangaon, Raigad District, Maharashtra', lat: 18.2561, lng: 73.2872 },
  { name: 'Mahad City & Gandharpale Caves (Raigad Fort Route)', address: 'Mahad, Raigad District, Maharashtra', lat: 18.0825, lng: 73.4186 },
  { name: 'Raigad Fort (Capital of Chhatrapati Shivaji Maharaj)', address: 'Pachad, Mahad, Raigad, Maharashtra', lat: 18.2347, lng: 73.4464 },
  { name: 'Chiplun City & Parshuram Mandir (NH 66)', address: 'Chiplun, Ratnagiri District, Maharashtra', lat: 17.5328, lng: 73.5186 },
  { name: 'Khed & Bharne Naka (NH 66)', address: 'Khed, Ratnagiri District, Maharashtra', lat: 17.7214, lng: 73.3931 },
  { name: 'Guhagar Beach & Velneshwar', address: 'Guhagar, Ratnagiri District, Maharashtra', lat: 17.4839, lng: 73.1917 },
  { name: 'Ganpatipule (Swayambhu Ganesh Mandir & Beach)', address: 'Ganpatipule, Ratnagiri District, Maharashtra', lat: 17.1458, lng: 73.2667 },
  { name: 'Ratnagiri Central (Mandvi Beach & Thiba Palace)', address: 'Ratnagiri District Headquarters, Maharashtra', lat: 16.9902, lng: 73.3120 },
  { name: 'Kankavli Highway Town (NH 66)', address: 'Kankavli, Sindhudurg District, Maharashtra', lat: 16.2736, lng: 73.7142 },
  { name: 'Tarkarli Beach (Scuba Diving & Water Sports)', address: 'Tarkarli, Malvan, Sindhudurg, Maharashtra', lat: 16.0357, lng: 73.4907 },
  { name: 'Malvan City & Sindhudurg Fort', address: 'Malvan, Sindhudurg District, Maharashtra', lat: 16.0597, lng: 73.4678 },
  { name: 'Kudal Central (NH 66)', address: 'Kudal, Sindhudurg District, Maharashtra', lat: 16.0089, lng: 73.6872 },
  { name: 'Sawantwadi City (Moti Talao & Wooden Toys Palace)', address: 'Sawantwadi, Sindhudurg District, Maharashtra', lat: 15.9056, lng: 73.8214 },
  { name: 'Vengurla Beach & Port', address: 'Vengurla, Sindhudurg District, Maharashtra', lat: 15.8617, lng: 73.6358 },

  // =========================================================================
  // NATIONAL CONNECTING CORRIDORS
  // =========================================================================
  { name: 'Connaught Place, New Delhi', address: 'Connaught Place, New Delhi, Delhi', lat: 28.6315, lng: 77.2167 },
  { name: 'Dhaula Kuan, New Delhi', address: 'Dhaula Kuan, New Delhi, Delhi', lat: 28.5916, lng: 77.1614 },
  { name: 'IGI Airport T3, New Delhi', address: 'Indira Gandhi International Airport, New Delhi', lat: 28.5562, lng: 77.1000 },
  { name: 'Cyber City, Gurugram', address: 'DLF Cyber City, Phase 2, Gurugram, Haryana', lat: 28.4952, lng: 77.0895 },
  { name: 'Sector 62, Noida', address: 'Sector 62, Noida, Gautam Buddha Nagar, Uttar Pradesh', lat: 28.6280, lng: 77.3649 },
  { name: 'MI Road, Jaipur', address: 'Mirza Ismail Road, Jaipur, Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'MG Road, Bengaluru', address: 'MG Road, Bengaluru, Karnataka', lat: 12.9756, lng: 77.6066 },
  { name: 'Electronic City Phase 1, Bengaluru', address: 'Electronic City, Bengaluru, Karnataka', lat: 12.8452, lng: 77.6602 },
  { name: 'Kengeri Satellite Town, Bengaluru', address: 'Kengeri, Bengaluru, Karnataka', lat: 12.9177, lng: 77.4838 },
  { name: 'Mysuru Palace, Mysuru', address: 'Sayyaji Rao Rd, Agrahara, Chamrajpura, Mysuru, Karnataka', lat: 12.3052, lng: 76.6552 },
  { name: 'Hitec City, Hyderabad', address: 'Madhapur, Hitec City, Hyderabad, Telangana', lat: 17.4435, lng: 78.3772 },
  { name: 'SG Highway, Ahmedabad', address: 'Sarkhej - Gandhinagar Hwy, Ahmedabad, Gujarat', lat: 23.0338, lng: 72.5073 },
  { name: 'Surat Central', address: 'Ring Road, Surat, Gujarat', lat: 21.1702, lng: 72.8311 },
  { name: 'Alkapuri, Vadodara', address: 'Alkapuri, Vadodara, Gujarat', lat: 22.3107, lng: 73.1812 },
  { name: 'Panaji Central, Goa', address: 'Panaji, Goa, India', lat: 15.4909, lng: 73.8278 },
  { name: 'Calangute / Baga Beach, North Goa', address: 'Calangute, Goa, India', lat: 15.5439, lng: 73.7553 },
];

export class PlacesService implements IPlacesProvider {
  async searchPlaces(query: string): Promise<LocationPoint[]> {
    if (!query || query.trim().length < 2) return [];

    const cleanQuery = query.toLowerCase().trim();

    // 1. Instant local index lookup
    const localMatches = INDIAN_PLACES_DATABASE.filter(
      (p) =>
        p.name.toLowerCase().includes(cleanQuery) ||
        (p.address && p.address.toLowerCase().includes(cleanQuery))
    );

    // If we have verified local Maharashtra / Indian database matches, return immediately
    if (localMatches.length >= 2 || (localMatches.length >= 1 && cleanQuery.length >= 4)) {
      return localMatches.slice(0, 7);
    }

    // 2. 100% Free OpenStreetMap Photon geocoder (Zero API Key, Zero Cost)
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&bbox=68,6,97,37`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.features && json.features.length > 0) {
          const apiMatches: LocationPoint[] = json.features.map(
            (f: {
              geometry: { coordinates: [number, number] };
              properties: { name?: string; city?: string; state?: string; country?: string };
            }) => {
              const name = f.properties.name || f.properties.city || 'Location';
              const parts = [f.properties.city, f.properties.state, f.properties.country].filter(Boolean);
              return {
                name: `${name}${f.properties.city ? `, ${f.properties.city}` : ''}`,
                address: parts.join(', '),
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0],
              };
            }
          );

          // Combine with deduplication
          const combined = [...localMatches];
          apiMatches.forEach((m) => {
            if (!combined.some((c) => Math.abs(c.lat - m.lat) < 0.01 && Math.abs(c.lng - m.lng) < 0.01)) {
              combined.push(m);
            }
          });
          return combined.slice(0, 7);
        }
      }
    } catch {
      // Fallback silently to local matches
    }

    return localMatches.slice(0, 7);
  }

  async reverseGeocode(lat: number, lng: number): Promise<LocationPoint> {
    // 1. Check local proximity
    for (const place of INDIAN_PLACES_DATABASE) {
      const dist = Math.hypot(place.lat - lat, place.lng - lng);
      if (dist < 0.04) {
        return {
          name: `Near ${place.name}`,
          address: place.address,
          lat,
          lng,
        };
      }
    }

    // 2. Free OpenStreetMap reverse lookup
    try {
      const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.features && json.features.length > 0) {
          const prop = json.features[0].properties;
          const name = prop.name || prop.street || prop.city || 'Detected Location';
          const parts = [prop.city, prop.state, prop.country].filter(Boolean);
          return {
            name,
            address: parts.join(', '),
            lat,
            lng,
          };
        }
      }
    } catch {
      // Fallback
    }

    return {
      name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      address: 'Current detected GPS location',
      lat,
      lng,
    };
  }
}

export const placesService = new PlacesService();
