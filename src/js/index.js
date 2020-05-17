import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import * as searchViews from './views/searchViews';
import * as recipeView from './views/recipeView';
import { elements, renderLoader, clearLoader } from './views/base';
import  * as ListView from './views/ListView';
import Likes from './models/Likes';
import  * as likesView from './views/likesview'

/** Global state of the app 
* - Search Object
* - Current recipe object
* - Shopping List object
* - Liked recipes 
*/
const state = {};
window.state = state;

/**
 * Search controller
 */

const controlSearch =  async () => {
    //get quer from view
        const query = searchViews.getInput();
                

        if (query) {
            //2 new search object and add to ststae
            state.search = new Search(query);

            // 3) prepare UI for results
            searchViews.clearInput();
            searchViews.clearResults();
            renderLoader(elements.searchRes);


                try {
            // 4) Serach for recipies
              await state.search.getResults();
                
             // 5) Render results on the UI
                clearLoader();
                searchViews.renderResults(state.search.result );
                }catch (err){
                  alert('sonething wrong with the searh ...')
                  clearLoader();
                }
        }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});



elements.searchResPages.addEventListener('click' , e => {
    const btn = e.target.closest('.btn-inline');
    if(btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchViews.clearResults();
        searchViews.renderResults(state.search.result, goToPage );
    
    }
    
    
});

/**
 * Recipe controller
 */

 const controlRecipe =  async () => {
     // GET ID form url
     const id = window.location.hash.replace('#', '');
     console.log(id);

     if (id) {
         // prepare UI for changes
         recipeView.clearRecipe();
         renderLoader(elements.recipe);

         //Hightlight selected search item
        if(state.search)  searchViews.highlightSelected(id);

         //craete new recipe object
         state.recipe = new Recipe(id);

            

         //Get recipe data and parse ingredientsS
         try {
         await state.recipe.getRecipe();
         state.recipe.parseIngredients();

         // calculate servings and time
            state.recipe.calctime();
            state.recipe.calcServings();

         //Render recipe.

            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
                );
         }catch (err) {
             console.log(err);
             alert('Error processing recipe');

         }
     }
 };

//window.addEventListener('hashchange', controlRecipe);
//window.addEventListener('load', controlRecipe);

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

//list ctrl
const controlList = () => {
    // new list if not 
    if(!state.list)  state.list = new List();
    // add each ingredients to the list and UI
     state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count , el.unit, el.ingredient);
        ListView.renderItem(item);
     });
}

// handle del and update list item events

elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    if ( e.target.matches('.shopping__delete, .shopping__delete *')) {
// delete from state
 state.list.deleteItem(id);

 // delete from UI

 ListView.deleteItem(id);

 // handle update account
    }else if (e.target.matches('.shopping__count-value')) {
       const val = parseFloat(e.target.value, 10);
       state.list.updateCount(id, val);

    }
} );

// testing

state.likes = new Likes();
likesView.toggleLikeMenu(state.likes.getNumLikes());

/* Like controller */
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
    // user ha not yet liked current recipe
    if(!state.likes.isLiked(currentID)) {
        // add  like to state

        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img

        );

        // toggle the like button
        likesView.toggleLikeBtn(true);

        // add like to UI list
        likesView.renderLike(newLike);

        //user has liked current recipe
     } else {
         //remove  like to state
        state.likes.deleteLike(currentID);
        // toggle the like button
            likesView.toggleLikeBtn(false);
        // remove  like to UI list
         likesView.deleteLike(currentID);
        }
  likesView.toggleLikeMenu(state.likes.getNumLikes());  
};






// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
 if(e.target.matches('.btn-decrease, .btn-decrease * ')){
        //Decrease button is clicked
        if (state.recipe.servings  > 1) {

    
        state.recipe.updateServings('dec');
        recipeView.updateServingsIngredients(state.recipe);
        }


 } else if (e.target.matches('.btn-increase, .btn-increase *')) {
     // Increase button is clicked
     state.recipe.updateServings('inc');
     recipeView.updateServingsIngredients(state.recipe);
 } else if ( e.target.matches('.recipe__btn--add , .recipe__btn--add *' )) {
    // Add ingredients to shooping list
    controlList();
 } else if (e.target.matches('.recipe__love, .recipe__love *')){
     //like controller
     controlLike();
 }

 });

 
 window.l = new List();