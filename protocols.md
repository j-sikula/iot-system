# Matter
- works on any IPv6 network (eg. Thread)

## Libraries
- [connectedhomeip](https://github.com/project-chip/connectedhomeip/)
- [esp-matter](https://github.com/espressif/esp-matter)

## Values and meaning

[Matter App cluster specification PDF](https://csa-iot.org/wp-content/uploads/2026/09/23-27350-011_Matter-1.6.1-Application-Cluster-Specification.pdf)



| EQ Parameter | Cluster ID & PICS | Spec Section & Pages | Attribute ID & Name | Data Type | Encoding Formula & Resolution | Valid Range & Special Values |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Temperature | 0x0402 (TMP) | Sec. 2.3 (pp. 184–185) | 0x0000 MeasuredValue | temperature (signed int16) | Value = 100 × T_°C (0.01 °C resolution; defined in Core Spec Sec. 7.19.2, p. 533) | -27315 (-273.15 °C) to 32766 (327.66 °C); null = unknown. |
| Relative Humidity | 0x0405 (RH) | Sec. 2.6 (pp. 190–191) | 0x0000 MeasuredValue | uint16 | Value = 100 × RH_% (0.01% resolution) | 0 to 10000 (0.00% to 100.00%); null = unknown. |
| Illuminance (Light) | 0x0400 (ILL) | Sec. 2.2 (pp. 181–184) | 0x0000 MeasuredValue | uint16 | Value = 10000 × log10(Lux) + 1 (Logarithmic encoding) | 1 to 65534 (0xFFFE), representing 1 lx to 3.576 Mlx. 0 = too low to measure; null = invalid. |
| Barometric Pressure | 0x0403 (PRS) | Sec. 2.4 (pp. 185–188) | 0x0000 MeasuredValue (or 0x0010 ScaledValue) | int16 | Base: Value = 10 × P_kPa<br><br>Extended (EXT): ScaledValue = 10^Scale × P_Pa | Up to 32767; Scale (0x0014) is an int8 exponent; null = unavailable. |
| Air Flow Rate | 0x0404 (FLW) | Sec. 2.5 (pp. 188–190) | 0x0000 MeasuredValue | uint16 | Value = 10 × Flow_m³/h (0.1 m³/h resolution) | 0 to 65534; null = unknown. |
| Occupancy Sensing | 0x0406 (OCC) | Sec. 2.7 (pp. 192–203) | 0x0000 Occupancy | OccupancyBitmap (map8) | Bit 0 (Occupied): 1 = Occupied, 0 = Unoccupied (Bits 1..7 set to 0) | 0 to 1. Modalities (PIR, Ultrasonic, Radar, RF, Vision, etc.) are encoded in FeatureMap (pp. 193–194). |
| Overall Air Quality | 0x005B (AIRQUAL) | Sec. 2.9 (pp. 207–209) | 0x0000 AirQuality | AirQualityEnum (enum8) | Discrete 8-bit unsigned enumeration mapped by manufacturer | 0 = Unknown, 1 = Good, 2 = Fair, 3 = Moderate, 4 = Poor, 5 = VeryPoor, 6 = ExtremelyPoor (p. 208). |


Unit of Measurement Encoding (MeasurementUnit, Attribute 0x0008, Page 211 & 214):
Encoded as MeasurementUnitEnum (enum8, 1 byte) (Page 211):   
- 0 = PPM (Parts per Million, $10^6$ — standard for $\text{CO}_2$, $\text{CO}$)   
- 1 = PPB (Parts per Billion, $10^9$ — standard for TVOC, $\text{NO}_2$, $\text{O}_3$, Formaldehyde)   
- 2 = PPT (Parts per Trillion, $10^{12}$)   
- 3 = MGM3 ($\text{mg/m}^3$)   
- 4 = UGM3 ($\mu\text{g/m}^3$ — standard for $\text{PM}_1$, $\text{PM}_{2.5}$, $\text{PM}_{10}$, and TVOC mass concentration)   
- 5 = NGM3 ($\text{ng/m}^3$)   
- 6 = PM3 (Particles per $\text{m}^3$)   
- 7 = BQM3 (Becquerel per $\text{m}^3$, $\text{Bq/m}^3$ — standard for Radon)   