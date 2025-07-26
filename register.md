✅ Complete Key Modbus Register Table for GoodWe HT-Series Inverter
| **Parameter**                       | **Register (DEC)** | **Data Type** | **Length** | **Scale** | **Unit** | **Read/Write** | **Description**                                     |
| ----------------------------------- | ------------------ | ------------- | ---------- | --------- | -------- | -------------- | --------------------------------------------------- |
| **Grid A-phase Voltage (V1)**       | 32069              | U16           | 1          | ÷10       | V        | RO             | Voltage on Phase A                                  |
| **Grid B-phase Voltage (V2)**       | 32070              | U16           | 1          | ÷10       | V        | RO             | Voltage on Phase B                                  |
| **Grid C-phase Voltage (V3)**       | 32071              | U16           | 1          | ÷10       | V        | RO             | Voltage on Phase C                                  |
| **Grid A-phase Current (L1)**       | 32072              | S32           | 2          | ÷1000     | A        | RO             | Current on Phase A                                  |
| **Grid B-phase Current (L2)**       | 32074              | S32           | 2          | ÷1000     | A        | RO             | Current on Phase B                                  |
| **Grid C-phase Current (L3)**       | 32076              | S32           | 2          | ÷1000     | A        | RO             | Current on Phase C                                  |
| **Grid Frequency**                  | 32085              | U16           | 1          | ÷100      | Hz       | RO             | Grid frequency                                      |
| **Active Power (P)**                | 32080              | S32           | 2          | ÷1000     | kW       | RO             | Real-time active power                              |
| **Reactive Power (Q)**              | 32082              | S32           | 2          | ÷1000     | kVar     | RO             | Reactive power                                      |
| **Apparent Power (S)**              | 30133              | U32           | 2          | ÷1000     | kVA      | RO             | Apparent power                                      |
| **Power Factor**                    | 32084              | S16           | 1          | ÷1000     | —        | RO             | Cosφ                                                |
| **Inverter Efficiency**             | 32086              | U16           | 1          | ÷100      | %        | RO             | Conversion efficiency                               |
| **Internal Temperature**            | 32087              | S16           | 1          | ÷10       | °C       | RO             | Internal cabinet temperature                        |
| **Inverter Status 1**               | 32002              | U16           | 1          | —         | —        | RO             | 0: Standby, 1: Running, 2: Fault, etc.              |
| **Cumulative Energy (Total Yield)** | 32106              | U32           | 2          | ÷100      | kWh      | RO             | Total generated energy since commissioning          |
| **Daily Energy (Today’s kWh)**      | 32114              | U32           | 2          | ÷100      | kWh      | RO             | Today's energy yield                                |
| **Monthly Energy (This Month)**     | 32116              | U32           | 2          | ÷100      | kWh      | RO             | Energy generated this month                         |
| **Yearly Energy (This Year)**       | 32118              | U32           | 2          | ÷100      | kWh      | RO             | Energy generated this year                          |
| **DC Input Power**                  | 32064              | S32           | 2          | ÷1000     | kW       | RO             | PV array input power                                |
| **PV1 Voltage**                     | 32016              | S16           | 1          | ÷10       | V        | RO             | Voltage of PV string 1                              |
| **PV1 Current**                     | 32017              | S16           | 1          | ÷100      | A        | RO             | Current of PV string 1                              |
| **PV2–PV24**                        | 32018–32063        | S16           | 1 each     | ÷10/100   | V / A    | RO             | Voltage/Current for each PV string                  |
| **Device Serial Number**            | 35502              | STR           | 8          | —         | —        | RO             | DSP hardware serial number                          |
| **DSP1 Fault Code**                 | 35710              | U32           | 2          | —         | —        | RO             | Main DSP fault code                                 |
| **DSP2 Fault Code**                 | 35718              | U32           | 2          | —         | —        | RO             | Slave DSP fault code                                |
| **PV Reversed Connection Status**   | 35714              | U32           | 2          | —         | —        | RO             | 0: OK, 1: PV string reversed (bitwise per string)   |
| **PV Short Circuit Status**         | 35720              | U16           | 1          | —         | —        | RO             | Bit 0–12 represent MPPT1–MPPT12 short circuit check |
| **Export Limit Enable**             | 41327              | U16           | 1          | —         | —        | RW             | 0: Disable, 1: Enable export power limit            |
| **Export Limit Power (W)**          | 41328              | U32           | 2          | —         | W        | RW             | Max export power setting                            |
| **Start Command**                   | 41330              | U16           | 1          | —         | —        | RW             | Write 0 to turn on inverter                         |
| **Shutdown Command**                | 41331              | U16           | 1          | —         | —        | RW             | Write 0 to shut down inverter                       |
| **Reconnect (Restart)**             | 41332              | U16           | 1          | —         | —        | WO             | Write 0 to restart inverter                         |





📋 PV2–PV24 Register Table

| PV Input | Voltage Register | Current Register | Unit (V/A) | Data Type | Scale      |
| -------- | ---------------- | ---------------- | ---------- | --------- | ---------- |
| PV2      | 32018            | 32019            | V / A      | S16       | ÷10 / ÷100 |
| PV3      | 32020            | 32021            | V / A      | S16       | ÷10 / ÷100 |
| PV4      | 32022            | 32023            | V / A      | S16       | ÷10 / ÷100 |
| PV5      | 32024            | 32025            | V / A      | S16       | ÷10 / ÷100 |
| PV6      | 32026            | 32027            | V / A      | S16       | ÷10 / ÷100 |
| PV7      | 32028            | 32029            | V / A      | S16       | ÷10 / ÷100 |
| PV8      | 32030            | 32031            | V / A      | S16       | ÷10 / ÷100 |
| PV9      | 32032            | 32033            | V / A      | S16       | ÷10 / ÷100 |
| PV10     | 32034            | 32035            | V / A      | S16       | ÷10 / ÷100 |
| PV11     | 32036            | 32037            | V / A      | S16       | ÷10 / ÷100 |
| PV12     | 32038            | 32039            | V / A      | S16       | ÷10 / ÷100 |
| PV13     | 32040            | 32041            | V / A      | S16       | ÷10 / ÷100 |
| PV14     | 32042            | 32043            | V / A      | S16       | ÷10 / ÷100 |
| PV15     | 32044            | 32045            | V / A      | S16       | ÷10 / ÷100 |
| PV16     | 32046            | 32047            | V / A      | S16       | ÷10 / ÷100 |
| PV17     | 32048            | 32049            | V / A      | S16       | ÷10 / ÷100 |
| PV18     | 32050            | 32051            | V / A      | S16       | ÷10 / ÷100 |
| PV19     | 32052            | 32053            | V / A      | S16       | ÷10 / ÷100 |
| PV20     | 32054            | 32055            | V / A      | S16       | ÷10 / ÷100 |
| PV21     | 32056            | 32057            | V / A      | S16       | ÷10 / ÷100 |
| PV22     | 32058            | 32059            | V / A      | S16       | ÷10 / ÷100 |
| PV23     | 32060            | 32061            | V / A      | S16       | ÷10 / ÷100 |
| PV24     | 32062            | 32063            | V / A      | S16       | ÷10 / ÷100 |







🚨 Alarm & Fault Information in the Manual
✅ Key Registers for Faults & Alarm States

| **Parameter**                     | **Register (DEC)** | **Length** | **Type** | **Description**                           | **Page** |
| --------------------------------- | ------------------ | ---------- | -------- | ----------------------------------------- | -------- |
| **DSP1 Fault Code**               | 35710              | 2          | U32      | Main DSP fault (refer to Table 8-4)       | Page 11  |
| **DSP2 Fault Code**               | 35718              | 2          | U32      | Slave DSP fault (refer to Table 8-5)      | Page 11  |
| **Reversed PV Connection Status** | 35714              | 2          | U32      | Bit flags for reversed strings (1–24)     | Page 11  |
| **PV Short Circuit Status**       | 35720              | 1          | U16      | Bit flags for MPPT1–MPPT12 short circuits | Page 11  |
| **Inverter Status 1**             | 32002              | 1          | U16      | Operating mode (includes fault codes)     | Page 5   |
| **Inverter Status 2**             | 37207              | 1          | U16      | Additional state (refer Table 8-6)        | Page 12  |





| **Fault Code** | **Haiwell Address** | **Message / Alarm Description**   |
| -------------- | ------------------- | --------------------------------- |
| 5001           | W\[10181]           | Grid Overvoltage                  |
| 5002           | W\[10181]           | Grid Undervoltage                 |
| 5003           | W\[10181]           | Grid Overfrequency                |
| 5004           | W\[10181]           | Grid Underfrequency               |
| 5005           | W\[10181]           | Grid Phase Loss                   |
| 5006           | W\[10181]           | PV Overvoltage                    |
| 5007           | W\[10181]           | Insulation Fault (Ground Fault)   |
| 5008           | W\[10181]           | Leakage Current High              |
| 5010           | W\[10181]           | Inverter Overtemperature          |
| 5012           | W\[10181]           | High DC Injection                 |
| 5013           | W\[10181]           | Output Overcurrent                |
| 5015           | W\[10181]           | DC Bus Overvoltage                |
| 5016           | W\[10181]           | DC Bus Undervoltage               |
| 5017           | W\[10181]           | AC Relay Check Failed             |
| 5019           | W\[10181]           | Grid Frequency Fluctuation Error  |
| 5020           | W\[10181]           | Relay Self-Check Failed           |
| 5021           | W\[10181]           | Precharge Fault                   |
| 5022           | W\[10181]           | Fan Fault                         |
| 5023           | W\[10181]           | EEPROM Communication Error        |
| 5025           | W\[10181]           | Grid Waveform Distortion Too High |
| 5027           | W\[10181]           | DSP Communication Fault           |
| 5030           | W\[10181]           | Hardware Circuit Abnormal         |
| 5032           | W\[10181]           | Software Protection Triggered     |
| 9999           | W\[10181]           | Unknown Fault                     |
