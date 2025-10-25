export function calculateScore({cookies,trackers, permissions, autofill}){
    let score = 100;
    score -= cookies * 1.5;
    score -= trackers * 2.5;
    score -= permissions.length * 8;
    score -= autofill ? 5 : 0;
    return Math.max (0, Math.min(score,100));
}