import { browser } from "$app/environment";

class StudyStore {
	mastered = $state<Record<string, boolean>>({});
	currentUnitId = $state("unit1");
	currentType = $state<"quiz" | "test">("quiz");
	examHistory = $state<{ date: number; score: number; total: number }[]>([]);
	wrongQuestions = $state<string[]>([]);

	constructor() {
		if (browser) {
			const stored = localStorage.getItem("voc_progress");
			if (stored) {
				try {
					const parsed = JSON.parse(stored);
					this.mastered = parsed.mastered || {};
					this.currentUnitId = parsed.currentUnitId || "unit1";
					this.currentType = parsed.currentType || "quiz";
					this.examHistory = parsed.examHistory || [];
					this.wrongQuestions = parsed.wrongQuestions || [];
				} catch (e) {
					console.error("Failed to load progress", e);
				}
			}
		}
	}

	getKey(unitId: string, type: string, term: string) {
		return `${unitId}:${type}:${term}`;
	}

	toggleMastered(unitId: string, type: string, term: string) {
		const key = this.getKey(unitId, type, term);
		if (this.mastered[key]) {
			const newMastered = { ...this.mastered };
			delete newMastered[key];
			this.mastered = newMastered;
		} else {
			this.mastered = { ...this.mastered, [key]: true };
		}
	}

	isMastered(unitId: string, type: string, term: string) {
		return !!this.mastered[this.getKey(unitId, type, term)];
	}

	getProgress(unitId: string, type: string, total: number) {
		let count = 0;
		for (const key in this.mastered) {
			if (key.startsWith(`${unitId}:${type}:`)) {
				count++;
			}
		}
		return {
			count,
			percentage: total === 0 ? 0 : Math.round((count / total) * 100),
		};
	}

	addExamResult(score: number, total: number) {
		this.examHistory = [
			...this.examHistory,
			{ date: Date.now(), score, total },
		];
	}

	addWrongQuestion(questionId: string) {
		if (!this.wrongQuestions.includes(questionId)) {
			this.wrongQuestions = [...this.wrongQuestions, questionId];
		}
	}

	removeWrongQuestion(questionId: string) {
		this.wrongQuestions = this.wrongQuestions.filter((id) => id !== questionId);
	}
}

export const studyStore = new StudyStore();
