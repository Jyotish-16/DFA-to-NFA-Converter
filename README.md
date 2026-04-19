# NFA to DFA Converter

**Developed by:** Jyotish Rakoti 

---

##  Overview
This project implements the conversion of a **Non-Deterministic Finite Automaton (NFA)** into an equivalent **Deterministic Finite Automaton (DFA)** using the **Subset Construction (Rabin-Scott) Algorithm**.

The application provides an interactive interface where users can define an NFA, perform conversion, and visualize the resulting DFA along with step-by-step computation.

---

## 🎯 Objectives
- To understand the concepts of NFA and DFA  
- To implement subset construction algorithm  
- To visualize automata conversion  
- To verify correctness using string testing  

---

##  Features
- Interactive NFA input (states, alphabet, transitions)  
- Support for ε (epsilon) transitions  
- Step-by-step conversion process  
- Automatic generation of DFA transition table  
- Visualization of NFA and DFA using diagrams  
- String testing functionality  
- Comparison of NFA and DFA outputs  

---

## Theory
- **NFA (Non-Deterministic Finite Automaton):**
  - Allows multiple transitions for the same input symbol  
  - Supports ε (epsilon) transitions  

- **DFA (Deterministic Finite Automaton):**
  - Exactly one transition for each input symbol  
  - No ε transitions  

- **Subset Construction:**
  - Converts NFA into DFA  
  - Each DFA state represents a set of NFA states  

---

##  Algorithm
The conversion follows these steps:
1. Compute ε-closure of the start state  
2. For each input symbol:
   - Apply move() function  
   - Compute ε-closure of result  
3. Create new DFA states from obtained sets  
4. Repeat until no new states are generated  
5. Add dead (trap) state if required  

---

##  Technologies Used
- **HTML** – Structure of the application  
- **CSS** – Styling and layout  
- **JavaScript** – Core logic and algorithm implementation  

---

##  Project Structure
