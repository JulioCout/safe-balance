Para este exemplo, vamos utilizar os dados reais de uma das aeronaves mais populares do mundo: o **Cessna 172 Skyhawk**.

Imagine que vamos fazer um voo curto. Precisamos calcular se o peso total e o centro de gravidade estão dentro dos limites de segurança estabelecidos pelo manual (POH).

### Dados da Aeronave e Carregamento

* **Peso Vazio (BEW):** 1.642 lb
* **Braço do Peso Vazio:** 38,3 in
* **Piloto e Passageiro Dianteiro:** 340 lb (170 lb cada) no braço 37 in
* **Passageiros Traseiros:** 150 lb no braço 73 in
* **Bagagem (Área 1):** 40 lb no braço 95 in
* **Combustível (30 galões):** 180 lb (aprox. 6 lb/gal) no braço 48 in

---

### Tabela de Cálculo de Peso e Momento

| Item | Peso (lb) | Braço (in) | Momento (lb-in) |
| --- | --- | --- | --- |
| Aeronave Vazia | 1.642 | 38,3 | 62.888,6 |
| Ocupantes Dianteiros | 340 | 37,0 | 12.580,0 |
| Passageiros Traseiros | 150 | 73,0 | 10.950,0 |
| Bagagem | 40 | 95,0 | 3.800,0 |
| Combustível (30 gal) | 180 | 48,0 | 8.640,0 |
| **TOTAIS** | **2.352** | **--** | **98.858,6** |

---

### Encontrando o Centro de Gravidade (CG)

Para achar a posição do CG em polegadas, dividimos o momento total pelo peso total:

$$CG = \frac{98.858,6}{2.352} \approx \mathbf{42,03 \text{ in}}$$

---

### Verificação de Segurança (Checklist)

1. **Peso Máximo de Decolagem (MTOW):**
* O MTOW de um Cessna 172 costuma ser **2.550 lb**.
* Nosso peso é **2.352 lb**. **(DENTRO DO LIMITE)** ✅


2. **Limites do Envelope de CG:**
* Para esse peso (aprox. 2.350 lb), o limite dianteiro é cerca de **38,5 in** e o traseiro é **47,3 in**.
* Nosso CG está em **42,03 in**. **(DENTRO DO LIMITE)** ✅



### O que isso significa no voo?

Como o CG está bem distribuído (quase no centro do envelope), a aeronave terá uma performance de subida padrão e uma estabilidade longitudinal equilibrada. Se colocássemos muita bagagem pesada e nenhum passageiro na frente, o CG iria para trás, tornando o nariz "leve" e perigoso durante o pouso.

**Quer testar o que acontece se adicionarmos mais carga ou mudarmos o combustível?**