let rules = {};
let courses = {};

window.onload = async function () {
  rules = await fetch("rules.json").then((res) => res.json());
  courses = await fetch("courses.json").then((res) => res.json());

  const selector = document.getElementById("majorSelector");
  
  rules.forEach((rule, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = rule.major;
    selector.appendChild(option);
  });

  loadMajor();
};

function loadMajor() {
  const container = document.getElementById("formContainer");
  container.innerHTML = "";
  
  const selector = document.getElementById("majorSelector");
  const index = selector.value;

  rules[index].ruleset.forEach((category) => {
    const categoryName = category.category;

    const section = document.createElement("div");
    section.className = "category-section";

    const label = document.createElement("h3");
    label.textContent = categoryName;
    section.appendChild(label);

    const message = document.createElement("p");
    message.className = "category-message";
    message.style.whiteSpace = "pre";
    section.appendChild(message);

    for (let i = 0; i < 10; i++) {
      const input = document.createElement("div");

      const prefixInput = document.createElement("input");
      prefixInput.type = "text";
      prefixInput.placeholder = "CRSE";
      prefixInput.className = "course-prefix";
      input.appendChild(prefixInput);

      const codeInput = document.createElement("input");
      codeInput.type = "text";
      codeInput.placeholder = "XXXX";
      codeInput.className = "course-code";
      input.appendChild(codeInput);

      section.appendChild(input);
    }

    container.appendChild(section);
  });
}

function validateAll() {
  const sections = document.querySelectorAll(".category-section");
  sections.forEach((section, index) => {
    const inputs = section.querySelectorAll("div");
    let inputCourses = [];
    inputs.forEach((input) => {
      const prefix = input.querySelector(".course-prefix").value;
      const code = input.querySelector(".course-code").value;
      if (!prefix || !code) return;
      inputCourses.push({
        prefix: prefix,
        code: code,
      });
    });

    const selector = document.getElementById("majorSelector");
    const majorIndex = selector.value;
    
    const unsatisfiedRules = validateCategory(rules[majorIndex].ruleset[index], inputCourses);
    const message = section.querySelector(".category-message");
    let messageText = unsatisfiedRules.length > 0 ? "Unsatified conditions: " : "All conditions satisfied!";
    unsatisfiedRules.forEach((rule) => {
      messageText += "\n\t";
      messageText += rule.type === "universal" ? "∀x" : "∃x";
      messageText += " (";
      ruleTexts = [];
      if (rule.prefixes) ruleTexts.push((rule.prefixes.length > 1 ? "(" : "") + rule.prefixes.map((prefix) => `${prefix}(x)`).join(" ∨ ") + (rule.prefixes.length > 1 ? ")" : ""));
      if (rule.attribute) ruleTexts.push(rule.attribute.replace(/\s+/g, '') + "(x)");
      if (rule.level) ruleTexts.push(rule.level + "Level(x)");
      if (rule.courses) ruleTexts.push((rule.courses.length > 1 ? "(" : "") + rule.courses.map((course) => `x = ${course.prefix}-${course.code}`).join(" ∨ ") + (rule.courses.length > 1 ? ")" : ""));
      if (rule.notcourses) ruleTexts.push((rule.notcourses.length > 1 ? "(" : "") + rule.notcourses.map((course) => `x ≠ ${course.prefix}-${course.code}`).join(" ∧ "));
      if (rule.count && rule.courses) ruleTexts.push("∃y " + "(" + "x ≠ y" + " ∧ " + (rule.courses.length > 1 ? "(" : "") + rule.courses.map((course) => `y = ${course.prefix}-${course.code}`).join(" ∨ ") + (rule.courses.length > 1 ? ")" : "") + ")");
      messageText += ruleTexts.join(" ∧ ");
      messageText += ")";
    });
    message.textContent = messageText;
  });
}

function attributes(course) {
  const subjectCourses = courses.filter((subject) => {
    if (subject.code == course.prefix) return true;
    return false;
  });
  const courseSections = subjectCourses[0].courses.filter((subjectCourse) => {
    if (subjectCourse.crse == course.code) return true;
    return false;
  });
  if (!courseSections[0]) return "";
  return courseSections[0].sections[0].attribute;
}

function courseCredits(course) {
  const subjectCourses = courses.filter((subject) => {
    if (subject.code == course.prefix) return true;
    return false;
  });
  console.log(subjectCourses);
  const courseSections = subjectCourses[0].courses.filter((subjectCourse) => {
    if (subjectCourse.crse == course.code) return true;
    return false;
  });
  if (!courseSections[0]) return 0;
  return courseSections[0].sections[0].credMax;
}

function validateCategory(category, courses) {
  let answer = [];
  let matches = [];

  for (const rule of category.rules) {
    switch (rule.type) {
      case "universal":
        matches = courses.filter((course) => {
          if (rule.prefixes)
            if (!rule.prefixes.includes(course.prefix)) return false;
          return true;
        });
        if (matches.length < courses.length) {
          answer.push(rule);
          continue;
        }
        break;
      case "existential":
        matches = courses.filter((course) => {
          if (rule.prefixes)
            if (!rule.prefixes.includes(course.prefix)) return false;
          if (rule.attribute) {
            if (attributes(course).indexOf(rule.attribute) === -1) return false;
          }
          if (rule.level) if (course.code < rule.level) return false;
          if (rule.courses)
            if (!rule.courses.some((ruleCourse) => ruleCourse.prefix == course.prefix && ruleCourse.code == course.code)) return false;
          if (rule.notcourses)
            if (rule.notcourses.some((ruleCourse) => ruleCourse.prefix == course.prefix && ruleCourse.code == course.code)) return false;
          return true;
        });
        if (matches.length === 0) {
          answer.push(rule);
          continue;
        }
        if (rule.count)
          if (matches.length < rule.count) {
            answer.push(rule);
            continue;
          }
        break;
    }
  }
  return answer;
}
